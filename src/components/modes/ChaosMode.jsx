import React, { useState } from 'react';
import useGameStore from '../../store/useGameStore';
import RoomActions from '../../store/RoomActions';
import RandomizerEngine from '../../RandomizerEngine';
import databaseObj from '../../../database.json';
import ArmorDisplay from '../ui/ArmorDisplay';
import SteamWindow from '../ui/SteamWindow';
import SteamBox from '../ui/SteamBox';
import SteamInset from '../ui/SteamInset';
import SteamButton from '../ui/SteamButton';

const ChaosMode = () => {
  const { roomData, roomCode, isHost, uid } = useGameStore();
  const [engine] = useState(() => new RandomizerEngine(databaseObj));

  const mode = roomData?.mode || 'chaos_random';
  const playersMap = roomData?.players || {};
  const currentRoll = roomData?.currentRoll;
  const history = roomData?.history || {};
  
  const playersArr = Object.entries(playersMap).map(([id, p]) => ({ ...p, uid: id }));
  const uids = Object.keys(playersMap);

  const isReady = playersMap[uid]?.isReady || false;
  const allReady = uids.length > 0 && uids.every(id => playersMap[id]?.isReady);

  const handleReadyToggle = async () => {
      await RoomActions.toggleReadyStatus(roomCode, uid, !isReady);
  };

  const handleRoll = async () => {
    if (!isHost) return;
    await RoomActions.rollChaos(roomCode, mode, playersArr, history, engine);
  };

  const handleReturnToLobby = async () => {
    if (!isHost) return;
    await RoomActions.returnToLobby(roomCode, uids);
  };

  const handleResetPool = async () => {
    if (!isHost) return;
    await RoomActions.resetChaosPool(roomCode, playersArr, engine);
  };

  const poolStatus = roomData?.poolState || engine.getPoolStatus();

  // ------- ЛОББИ (PRE-DROP BRIEFING) -------
  if (!currentRoll) {
      return (
          <div className="flex items-center justify-center h-full w-full p-2 sm:p-4 overflow-y-auto custom-scrollbar font-mono">
              <SteamWindow className="max-w-4xl w-full p-4 flex flex-col gap-4">
                  <div className="steam-dialog-header mb-1 flex justify-between items-center text-xs">
                      <span className="font-bold tracking-wider">Operation Deployment Briefing [ {mode.replace('_', ' ').toUpperCase()} ]</span>
                      <span className="text-[10px] text-hcAccent uppercase">[ СТАТУС: ПОДГОТОВКА К ВЫСАДКЕ ]</span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                      
                      {/* Left: Pool Details */}
                      <div className="w-full md:w-1/2 flex flex-col gap-3">
                          <SteamBox 
                              title={mode === 'chaos_attrition' ? 'АТРИЦИЯ // СКЛАД СНАРЯЖЕНИЯ' : 'СЛУЧАЙНЫЙ СЕТЕВОЙ РЕСУРС'} 
                              className="pt-4 pb-3 px-3 flex-1 flex flex-col"
                          >
                              {mode === 'chaos_attrition' ? (
                                  <SteamInset className="p-3 space-y-2.5 flex-1">
                                    <PoolBar label="Основное оружие" count={poolStatus.primary} max={databaseObj.primary.length} />
                                    <PoolBar label="Вторичное оружие" count={poolStatus.secondary} max={databaseObj.secondary.length} />
                                    <PoolBar label="Гранаты" count={poolStatus.grenade} max={databaseObj.grenade.length} />
                                    <PoolBar label="Комплекты брони" count={poolStatus.armor} max={databaseObj.armor.length} />
                                    <PoolBar label="Бустеры" count={poolStatus.boosterReady} max={databaseObj.booster.length} />
                                    <PoolBar label="Стратагемы" count={poolStatus.stratagems} max={databaseObj.stratagems.length} />
                                  </SteamInset>
                              ) : (
                                  <SteamInset className="p-5 text-center flex-1 flex flex-col items-center justify-center gap-3">
                                      <p className="text-xs text-hcAccent uppercase font-bold tracking-wider">[ БЕСКОНЕЧНАЯ ЛОГИСТИКА ]</p>
                                      <p className="text-xs text-slate-400 max-w-[320px] leading-relaxed border-t border-[var(--steam-border-dark)] pt-3 font-mono">
                                          Командование Супер-Земли обеспечивает неограниченный поток снаряжения. Предметы не расходуются между миссиями.
                                      </p>
                                  </SteamInset>
                              )}
                              
                              {isHost && mode === 'chaos_attrition' && (
                                  <SteamButton 
                                      variant="tab" 
                                      onClick={handleResetPool} 
                                      className="mt-2 w-full py-2 text-[10px] font-mono uppercase tracking-wider text-red-400 hover:text-red-300"
                                  >
                                      [ СБРОСИТЬ ПУЛ ДО МАКСИМУМА ]
                                  </SteamButton>
                              )}
                          </SteamBox>
                      </div>

                      {/* Right: Squad & Ready Controls */}
                      <div className="w-full md:w-1/2 flex flex-col gap-3">
                          <SteamBox title="ГОТОВНОСТЬ ОТРЯДА" className="pt-4 pb-3 px-3 flex-1 flex flex-col">
                              <SteamInset className="p-2 flex-1 flex flex-col justify-start mb-2 bg-black/40 gap-1.5 overflow-y-auto">
                                  {playersArr.map((p, idx) => (
                                      <div key={p.uid} className={`flex items-center justify-between p-2.5 text-xs border border-[var(--steam-border-dark)] w-full font-mono ${p.uid === uid ? 'bg-hcDark/80 border-hcAccent/40' : 'bg-transparent'}`}>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-slate-500 bg-black/60 px-1.5 py-0.5 font-mono">0{idx + 1}</span>
                                              <span className={`font-bold uppercase tracking-wider ${p.uid === uid ? 'text-hcAccent' : 'text-slate-200'}`}>
                                                  {p.name} {p.uid === roomData.host && <span className="text-slate-500 text-[9px] lowercase bg-black px-1 ml-1">[хост]</span>}
                                              </span>
                                          </div>
                                          {p.isReady ? (
                                              <span className="text-emerald-300 bg-emerald-950/60 border border-emerald-600/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">[ ГОТОВ ]</span>
                                          ) : (
                                              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">[ ВЫБОР... ]</span>
                                          )}
                                      </div>
                                  ))}
                              </SteamInset>

                              <div className="flex flex-col gap-2 mt-auto">
                                  <SteamButton 
                                      variant={isReady ? 'primary' : 'tab'}
                                      onClick={handleReadyToggle}
                                      className={`py-2.5 text-xs font-mono font-bold uppercase tracking-wider w-full ${
                                          isReady ? 'text-emerald-300 border-emerald-500/50' : 'text-slate-200'
                                      }`}
                                  >
                                      {isReady ? '[ ОТМЕНИТЬ ГОТОВНОСТЬ ]' : '[ ПОДТВЕРДИТЬ ГОТОВНОСТЬ ]'}
                                  </SteamButton>

                                  {isHost && (
                                      <SteamButton 
                                          variant="primary"
                                          onClick={handleRoll}
                                          disabled={!allReady}
                                          className="py-3 text-xs font-mono font-bold uppercase tracking-wider w-full disabled:opacity-40"
                                      >
                                          [ ВЫСАДКА // СГЕНЕРИРОВАТЬ ]
                                      </SteamButton>
                                  )}
                                  
                                  {!isHost && (
                                      <SteamInset className="p-2.5 text-center bg-black/30 border-dashed border-[var(--steam-border-dark)] mt-0.5">
                                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold font-mono">ОЖИДАНИЕ ВЫСАДКИ ХОСТОМ...</span>
                                      </SteamInset>
                                  )}
                              </div>
                          </SteamBox>
                      </div>

                  </div>
              </SteamWindow>
          </div>
      );
  }

  // ------- DEPLOYED (РЕЗУЛЬТАТЫ ВЫСАДКИ) -------
  return (
      <div className="h-full w-full flex flex-col p-2 sm:p-3 space-y-3 max-w-7xl mx-auto overflow-hidden font-mono">
          
          <div className="steam-dialog-header shrink-0 flex justify-between items-center text-xs px-3.5 py-2">
             <div className="flex items-center gap-2">
                 <span className="uppercase tracking-wider font-bold text-slate-200">ОПЕРАТИВНИКИ // СНАРЯЖЕНИЕ СГЕНЕРИРОВАНО</span>
                 <span className="text-slate-500 text-[10px]">[ БОЙЦОВ: {currentRoll.builds.length} ]</span>
             </div>
             {isHost && (
                 <SteamButton variant="tab" onClick={handleReturnToLobby} className="py-1 px-3 text-[10px] uppercase font-bold tracking-wider">
                     [ ВЕРНУТЬСЯ В БРИФИНГ ]
                 </SteamButton>
             )}
          </div>

          <div className="flex-1 overflow-y-auto px-1 custom-scrollbar pb-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-4">
                  {currentRoll.builds.map((build, index) => {
                      const player = playersArr.find(p => p.uid === build.uid) || playersArr[index];
                      return (
                          <PlayerCard key={index} build={build} playerName={player?.name || `Helldiver ${build.playerIndex}`} />
                      );
                  })}
              </div>
          </div>
      </div>
  );
};

export default ChaosMode;

// ------ Subcomponents ------

function PoolBar({ label, count, max }) {
  const percent = Math.max(0, Math.min(100, (count / max) * 100));
  let colorClass = "bg-sky-500";
  if (percent < 30) colorClass = "bg-red-500";
  else if (percent < 60) colorClass = "bg-amber-500";

  return (
    <div className="flex flex-col gap-1 w-full bg-black/30 p-2 border border-[var(--steam-border-dark)] font-mono">
      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-200 font-mono text-[10px] bg-black/60 px-1.5 py-0.5">{count} <span className="text-slate-500">/ {max}</span></span>
      </div>
      <div className="w-full bg-black/80 h-[6px] overflow-hidden border border-[var(--steam-border-dark)]">
        <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function PlayerCard({ build, playerName }) {
  return (
    <SteamBox className="pt-8 pb-3 px-3 relative flex flex-col justify-between font-mono shadow-xl bg-hcPanel">
      {/* Card Header */}
      <div className="absolute top-0 left-0 w-full px-3 py-1.5 flex items-center justify-between z-10 border-b border-[var(--steam-border-dark)] bg-black/50">
           <span className="text-sm uppercase font-bold text-slate-100 tracking-wider truncate">{playerName}</span>
           <span className="text-xs text-black bg-hcAccent px-2 py-0.5 font-bold tracking-wider shrink-0 shadow-sm">SLOT 0{build.playerIndex}</span>
      </div>

      <SteamInset className="p-2.5 flex-1 flex flex-col gap-3 bg-[var(--color-bg-body)] mt-1">
          {/* Top Section: Weapons, Armor, Gear */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_130px_1fr] lg:grid-cols-[1fr_150px_1fr] gap-2.5 items-stretch min-h-[220px]">
             
             {/* Left Column: Weapons */}
             <div className="flex flex-col gap-2 justify-between">
                 <WeaponSlot item={build.primary} label="Primary Weapon" badge="PRIMARY" />
                 <WeaponSlot item={build.secondary} label="Secondary Weapon" badge="SECONDARY" />
             </div>
             
             {/* Center Column: Armor */}
             <div className="w-full min-h-[200px] flex flex-col">
                 <ArmorSlot item={build.armor} />
             </div>
             
             {/* Right Column: Booster & Grenade */}
             <div className="flex flex-col gap-2 justify-between">
                 <BoosterSlot item={build.booster} />
                 <GrenadeSlot item={build.grenade} />
             </div>
          </div>

          {/* Bottom Section: 4 Stratagems */}
          <div className="flex flex-col w-full pt-2 border-t border-[var(--steam-border-dark)]">
              <div className="flex justify-between items-center mb-1.5 px-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">СТРАТАГЕМЫ ПОДДЕРЖКИ:</span>
                  <span className="text-[9px] text-slate-500 font-mono">[ 4 СЛОТА ]</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                  {build.stratagems.map((strat, idx) => (
                      <StratagemSlot key={idx} strat={strat} slotNum={idx + 1} />
                  ))}
              </div>
          </div>
      </SteamInset>
    </SteamBox>
  );
}

function WeaponSlot({ item, label, badge }) {
  if (!item) return <EmptySlot label={label} />;

  return (
    <SteamInset className="flex-1 min-h-[95px] sm:min-h-[105px] p-2 bg-hcDark/50 flex flex-col justify-between relative group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors overflow-hidden">
      <div className="flex justify-between items-center w-full z-10">
          <span className="text-[8.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">[ {badge} ]</span>
      </div>
      <div className="h-14 sm:h-16 w-full flex items-center justify-center p-1 relative">
          <img 
              src={`/assets/images/${item.imageURL}`} 
              alt={item.name} 
              className="max-h-full max-w-full object-contain filter drop-shadow-md transform group-hover:scale-105 transition-transform"
              onError={(e) => {
                  const src = e.target.src;
                  if (src.endsWith('.svg')) e.target.src = src.replace('.svg', '.webp');
                  else if (src.endsWith('.webp')) e.target.src = src.replace('.webp', '.png');
                  else e.target.style.display = 'none';
              }} 
          />
      </div>
      <div className="w-full text-center px-1 bg-black/40 py-0.5 border-t border-[var(--steam-border-dark)]">
          <span className="text-[11px] sm:text-xs text-slate-100 uppercase font-mono font-bold truncate block">
              {item.name}
          </span>
      </div>
    </SteamInset>
  );
}

function BoosterSlot({ item }) {
  if (!item) return <EmptySlot label="Booster" />;

  return (
    <SteamInset className="flex-1 min-h-[95px] sm:min-h-[105px] p-2 bg-hcDark/50 flex flex-col justify-between relative group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors overflow-hidden">
      <div className="flex justify-between items-center w-full z-10">
          <span className="text-[8.5px] font-mono text-yellow-500/80 font-bold uppercase tracking-wider">[ BOOSTER ]</span>
      </div>
      <div className="h-14 sm:h-16 w-full flex items-center justify-center p-0.5 relative">
          <img 
              src={`/assets/images/${item.imageURL}`} 
              alt={item.name} 
              className="max-h-full max-w-full object-contain filter drop-shadow-md transform group-hover:scale-105 transition-transform" 
              onError={(e) => {
                  const src = e.target.src;
                  if (src.endsWith('.svg')) e.target.src = src.replace('.svg', '.webp');
                  else if (src.endsWith('.webp')) e.target.src = src.replace('.webp', '.png');
                  else e.target.style.display = 'none';
              }} 
          />
      </div>
      <div className="w-full text-center px-1 bg-black/40 py-0.5 border-t border-[var(--steam-border-dark)]">
          <span className="text-[10px] sm:text-[11px] text-slate-100 uppercase font-mono font-bold truncate block">
              {item.name}
          </span>
      </div>
    </SteamInset>
  );
}

function GrenadeSlot({ item }) {
  if (!item) return <EmptySlot label="Grenade" />;

  return (
    <SteamInset className="flex-1 min-h-[95px] sm:min-h-[105px] p-2 bg-hcDark/50 flex flex-col justify-between relative group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors overflow-hidden">
      <div className="flex justify-between items-center w-full z-10">
          <span className="text-[8.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">[ GRENADE ]</span>
      </div>
      <div className="h-14 sm:h-16 w-full flex items-center justify-center p-1 relative">
          <img 
              src={`/assets/images/${item.imageURL}`} 
              alt={item.name} 
              className="max-h-full max-w-full object-contain filter drop-shadow-md transform group-hover:scale-105 transition-transform"
              onError={(e) => {
                  const src = e.target.src;
                  if (src.endsWith('.svg')) e.target.src = src.replace('.svg', '.webp');
                  else if (src.endsWith('.webp')) e.target.src = src.replace('.webp', '.png');
                  else e.target.style.display = 'none';
              }} 
          />
      </div>
      <div className="w-full text-center px-1 bg-black/40 py-0.5 border-t border-[var(--steam-border-dark)]">
          <span className="text-[11px] sm:text-xs text-slate-100 uppercase font-mono font-bold truncate block">
              {item.name}
          </span>
      </div>
    </SteamInset>
  );
}

function ArmorSlot({ item }) {
  if (!item) return <EmptySlot label="Armor" />;

  return (
    <div className="w-full h-full min-h-[200px]">
        <ArmorDisplay item={item} showImage={true} showTooltip={true} />
    </div>
  );
}

function StratagemSlot({ strat, slotNum }) {
  if (!strat) return <EmptySlot label={`Strat 0${slotNum}`} />;

  return (
    <SteamInset className="min-h-[90px] sm:min-h-[100px] p-2 bg-hcDark/50 flex flex-col items-center justify-between relative group border-[var(--steam-border-dark)] hover:border-sky-500/50 transition-colors overflow-hidden">
      <div className="w-full flex justify-between items-center">
          <span className="text-[8px] font-mono text-sky-400 font-bold">[ STRAT 0{slotNum} ]</span>
      </div>
      <div className="h-12 sm:h-14 w-full flex items-center justify-center p-0.5 relative">
          <img 
              src={`/assets/stratagems/${strat.imageURL}`} 
              alt={strat.name} 
              className="max-h-full max-w-full object-contain filter drop-shadow-md transform group-hover:scale-110 transition-transform"
              onError={(e) => {
                  const src = e.target.src;
                  if (src.endsWith('.svg')) e.target.src = src.replace('.svg', '.webp');
                  else if (src.endsWith('.webp')) e.target.src = src.replace('.webp', '.png');
                  else e.target.style.display = 'none';
              }} 
          />
      </div>
      <div className="w-full text-center px-1 bg-black/40 py-0.5 border-t border-[var(--steam-border-dark)]">
          <span className="text-[9.5px] sm:text-[10.5px] text-slate-200 uppercase font-mono font-bold leading-tight line-clamp-1 block">
              {strat.name}
          </span>
      </div>
    </SteamInset>
  );
}

function EmptySlot({ label }) {
  return (
    <SteamInset className="flex flex-col items-center justify-center p-3 bg-black/40 min-h-[95px] border-dashed border-[var(--steam-border-dark)]">
      <span className="text-[10px] font-mono text-slate-600 uppercase font-bold">[ {label} ]</span>
    </SteamInset>
  );
}
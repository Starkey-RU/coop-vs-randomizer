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
              <SteamWindow className="max-w-4xl w-full p-3 flex flex-col gap-3">
                  <div className="steam-dialog-header mb-1 flex justify-between items-center text-xs">
                      <span>Operation Deployment Briefing [ {mode.replace('_', ' ').toUpperCase()} ]</span>
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
                                  <SteamInset className="p-2 space-y-2 flex-1">
                                    <PoolBar label="Основное оружие" count={poolStatus.primary} max={databaseObj.primary.length} />
                                    <PoolBar label="Вторичное оружие" count={poolStatus.secondary} max={databaseObj.secondary.length} />
                                    <PoolBar label="Гранаты" count={poolStatus.grenade} max={databaseObj.grenade.length} />
                                    <PoolBar label="Комплекты брони" count={poolStatus.armor} max={databaseObj.armor.length} />
                                    <PoolBar label="Бустеры" count={poolStatus.boosterReady} max={databaseObj.booster.length} />
                                    <PoolBar label="Стратагемы" count={poolStatus.stratagems} max={databaseObj.stratagems.length} />
                                  </SteamInset>
                              ) : (
                                  <SteamInset className="p-4 text-center flex-1 flex flex-col items-center justify-center gap-2">
                                      <p className="text-xs text-hcAccent uppercase font-bold tracking-wider">[ БЕСКОНЕЧНАЯ ЛОГИСТИКА ]</p>
                                      <p className="text-[11px] text-slate-400 max-w-[280px] leading-relaxed mt-2 border-t border-[var(--steam-border-dark)] pt-3 font-mono">
                                          Командование Супер-Земли обеспечивает неограниченный поток снаряжения. Предметы не расходуются между миссиями.
                                      </p>
                                  </SteamInset>
                              )}
                              
                              {isHost && mode === 'chaos_attrition' && (
                                  <SteamButton 
                                      variant="tab" 
                                      onClick={handleResetPool} 
                                      className="mt-2 w-full py-1.5 text-[10px] font-mono uppercase tracking-wider text-red-400 hover:text-red-300"
                                  >
                                      [ СБРОСИТЬ ПУЛ ДО МАКСИМУМА ]
                                  </SteamButton>
                              )}
                          </SteamBox>
                      </div>

                      {/* Right: Squad & Ready Controls */}
                      <div className="w-full md:w-1/2 flex flex-col gap-3">
                          <SteamBox title="ГОТОВНОСТЬ ОТРЯДА" className="pt-4 pb-3 px-3 flex-1 flex flex-col">
                              <SteamInset className="p-1.5 flex-1 flex flex-col justify-start mb-2 bg-black/40 gap-1 overflow-y-auto">
                                  {playersArr.map((p, idx) => (
                                      <div key={p.uid} className={`flex items-center justify-between p-2 text-xs border border-[var(--steam-border-dark)] w-full font-mono ${p.uid === uid ? 'bg-hcDark/80 border-hcAccent/40' : 'bg-transparent'}`}>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-slate-500 bg-black/60 px-1 py-0.5 font-mono">0{idx + 1}</span>
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
                                      className={`py-2 text-xs font-mono font-bold uppercase tracking-wider w-full ${
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
                                          className="py-2.5 text-xs font-mono font-bold uppercase tracking-wider w-full disabled:opacity-40"
                                      >
                                          [ ВЫСАДКА // СГЕНЕРИРОВАТЬ ]
                                      </SteamButton>
                                  )}
                                  
                                  {!isHost && (
                                      <SteamInset className="p-2 text-center bg-black/30 border-dashed border-[var(--steam-border-dark)] mt-0.5">
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
      <div className="h-full w-full flex flex-col p-2 space-y-3 max-w-7xl mx-auto overflow-hidden font-mono">
          
          <div className="steam-dialog-header shrink-0 flex justify-between items-center text-xs px-3 py-1.5">
             <span className="uppercase tracking-wider font-bold text-slate-200">ОПЕРАТИВНИКИ // СНАРЯЖЕНИЕ СГЕНЕРИРОВАНО</span>
             {isHost && (
                 <SteamButton variant="tab" onClick={handleReturnToLobby} className="py-0.5 px-2 text-[10px] uppercase font-bold tracking-wider">
                     [ ВЕРНУТЬСЯ В БРИФИНГ ]
                 </SteamButton>
             )}
          </div>

          <div className="flex-1 overflow-y-auto px-1 custom-scrollbar pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-2">
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
    <div className="flex flex-col gap-0.5 w-full bg-black/30 p-1.5 border border-[var(--steam-border-dark)] font-mono">
      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-200 font-mono text-[10px] bg-black/60 px-1">{count} <span className="text-slate-500">/ {max}</span></span>
      </div>
      <div className="w-full bg-black/80 h-[5px] overflow-hidden border border-[var(--steam-border-dark)]">
        <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function PlayerCard({ build, playerName }) {
  return (
    <SteamBox className="pt-6 pb-2 px-2 relative min-h-[260px] flex flex-col justify-between font-mono">
      <div className="absolute top-0 left-0 w-full px-2 pt-1 pb-1 flex items-center justify-between z-10 border-b border-[var(--steam-border-dark)] bg-black/40">
           <span className="text-xs uppercase font-bold text-slate-200 tracking-wider truncate">{playerName}</span>
           <span className="text-[10px] text-black bg-hcAccent px-1.5 py-0.2 font-bold tracking-wider shrink-0">SLOT 0{build.playerIndex}</span>
      </div>

      <SteamInset className="p-1.5 flex-1 flex flex-col gap-1.5 bg-[var(--color-bg-body)] mt-1">
          {/* Paper-doll layout */}
          <div className="grid grid-cols-[1fr_auto_1fr] flex-1 gap-1.5 relative z-50 h-[140px]">
             
             {/* Left: Weapons */}
             <div className="flex flex-col gap-1.5 justify-center w-full">
                 <ItemSlot item={build.primary} label="Primary" />
                 <ItemSlot item={build.secondary} label="Secondary" />
             </div>
             
             {/* Center: Armor */}
             <div className="shrink-0 w-[95px] lg:w-[115px] relative mx-0.5">
                 <ArmorSlot item={build.armor} />
             </div>
             
             {/* Right: Booster & Grenade */}
             <div className="flex flex-col gap-1.5 justify-center w-full">
                 {build.booster ? (
                      <SteamInset className="flex flex-col items-center justify-start p-1 bg-hcDark/40 h-[68px] group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors">
                         <div className="h-11 w-full flex items-center justify-center p-0.5 bg-black/40 overflow-hidden relative">
                             <img src={`/assets/images/${build.booster.imageURL}`} alt={build.booster.name} className="w-full h-full object-contain filter drop-shadow-md" onError={(e) => e.target.style.display = 'none'} />
                         </div>
                         <span className="text-[8.5px] text-center text-slate-300 uppercase font-mono font-bold leading-tight w-full truncate mt-0.5">{build.booster.name}</span>
                      </SteamInset>
                 ) : <EmptySlot label="Booster" />}
                 <ItemSlot item={build.grenade} label="Grenade" />
             </div>
          </div>

          <div className="flex flex-col w-full justify-end mt-1 pt-1.5 border-t border-[var(--steam-border-dark)]">
              <div className="grid grid-cols-4 gap-1 w-full">
                  {build.stratagems.map((strat, idx) => (
                      <StratagemSlot key={idx} strat={strat} />
                  ))}
              </div>
          </div>
      </SteamInset>
    </SteamBox>
  );
}

function ItemSlot({ item, label }) {
  if (!item) return <EmptySlot label={label} />;

  return (
    <SteamInset className="flex flex-col items-center justify-center p-1 bg-hcDark/40 h-[68px] relative group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors overflow-hidden">
      <div className="h-11 w-full flex items-center justify-center p-0.5 bg-black/40 relative">
          <img 
              src={`/assets/images/${item.imageURL}`} 
              alt={item.name} 
              className="w-full h-full object-contain filter drop-shadow-md"
              onError={(e) => e.target.style.display = 'none'} 
          />
      </div>
      <span className="text-[8.5px] text-center text-slate-300 uppercase font-mono font-bold leading-tight w-full truncate mt-0.5">
          {item.name}
      </span>
    </SteamInset>
  );
}

function ArmorSlot({ item }) {
  if (!item) return <EmptySlot label="Armor" />;

  return (
    <div className="w-full h-full">
        <ArmorDisplay item={item} showImage={true} showTooltip={true} />
    </div>
  );
}

function StratagemSlot({ strat }) {
  if (!strat) return <EmptySlot label="Strat" />;

  return (
    <SteamInset className="flex flex-col items-center justify-center p-1 bg-hcDark/40 h-[56px] relative group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors overflow-hidden">
      <div className="h-9 w-full flex items-center justify-center p-0.5 relative">
          <img 
              src={`/assets/stratagems/${strat.imageURL}`} 
              alt={strat.name} 
              className="w-full h-full object-contain filter drop-shadow-md"
              onError={(e) => e.target.style.display = 'none'} 
          />
      </div>
      <span className="text-[7.5px] text-center text-slate-300 uppercase font-mono font-bold leading-tight w-full truncate">
          {strat.name}
      </span>
    </SteamInset>
  );
}

function EmptySlot({ label }) {
  return (
    <SteamInset className="flex flex-col items-center justify-center p-1 bg-black/40 h-[68px] border-dashed border-[var(--steam-border-dark)]">
      <span className="text-[9px] font-mono text-slate-600 uppercase font-bold">[ {label} ]</span>
    </SteamInset>
  );
}
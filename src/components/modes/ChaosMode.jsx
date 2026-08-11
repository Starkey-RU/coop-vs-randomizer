import React, { useState, useEffect } from 'react';
import useGameStore from '../../store/useGameStore';
import RandomizerEngine from '../../RandomizerEngine';
import databaseObj from '../../../database.json';
import { Skull, RefreshCw, Zap, Crosshair, Shield, Activity, Package, CheckCircle, PlayCircle, ArrowLeft } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../../utils/firebase';
import ArmorDisplay from '../ui/ArmorDisplay';

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

  // Синхронизация пула (для зрителей, если надо)
  useEffect(() => {
    if (roomData?.poolState && !isHost) {
        // Observer sync
    }
  }, [roomData?.poolState]);

  const handleReadyToggle = async () => {
      await update(ref(db, `rooms/${roomCode}/players/${uid}`), {
          isReady: !isReady
      });
  };

  const handleRoll = async () => {
    if (!isHost) return;
    
    // В режиме Random пул не должен истощаться меж роллами
    if (mode === 'chaos_random') {
        engine.reset(playersArr);
    } else {
        // Если движок не инициализирован профилями - инициализируем
        if (!engine.playerProfiles) {
            engine.reset(playersArr);
        }
    }

    const result = engine.roll(playersArr);
    const newStatus = engine.getPoolStatus();

    const currentMissionCount = Object.keys(history).length + 1;

    const updates = {};
    updates[`rooms/${roomCode}/currentRoll`] = result;
    updates[`rooms/${roomCode}/poolState`] = newStatus;
    
    // Сброс флагов готовности после деплоя
    uids.forEach(id => {
        updates[`rooms/${roomCode}/players/${id}/isReady`] = false;
    });

    // Сохраняем в историю
    updates[`rooms/${roomCode}/history/mission_${currentMissionCount}`] = {
        timestamp: Date.now(),
        missionNumber: currentMissionCount,
        roll: result
    };

    try {
        await update(ref(db), updates);
    } catch (e) {
        console.error("Firebase sync error", e);
    }
  };

  const handleReturnToLobby = async () => {
    if (!isHost) return;
    
    const updates = {};
    updates[`rooms/${roomCode}/currentRoll`] = null;
    
    // Сбрасываем готовность всех игроков при возвращении в лобби
    uids.forEach(id => {
        updates[`rooms/${roomCode}/players/${id}/isReady`] = false;
    });
    
    try {
        await update(ref(db), updates);
    } catch (e) {
        console.error("Firebase sync error", e);
    }
  };

  const handleResetPool = async () => {
    if (!isHost) return;
    engine.reset(playersArr);
    
    await update(ref(db, `rooms/${roomCode}`), {
        currentRoll: null,
        poolState: engine.getPoolStatus()
    });
  };

  const poolStatus = roomData?.poolState || engine.getPoolStatus();

  // ------- ЛОББИ -------
  if (!currentRoll) {
      return (
          <div className="flex items-center justify-center h-full w-full p-4 overflow-y-auto custom-scrollbar">
              <div className="steam-dialog-window theme-panel max-w-4xl w-full p-4 flex flex-col gap-4 shadow-2xl">
                  <div className="steam-dialog-header mb-2 relative">
                      <span>Operation Deployment Briefing [ {mode.replace('_', ' ').toUpperCase()} ]</span>
                      <div className="absolute right-2 text-[10px] text-hcAccent animate-pulse uppercase">STATUS: PRE-DROP</div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                      
                      {/* Left Sidebar: Pool Details */}
                      <div className="w-full md:w-1/2 flex flex-col gap-4">
                          <div className="steam-group-box pt-4 pb-3 px-3 flex-1 flex flex-col">
                              <span className="steam-group-box-title">{mode === 'chaos_attrition' ? 'Attrition Supply Pool' : 'Random Supply Network'}</span>
                              
                              {mode === 'chaos_attrition' ? (
                                  <div className="steam-inset-box p-3 space-y-3 flex-1">
                                    <PoolBar icon={<Crosshair size={14} />} label="Primary" count={poolStatus.primary} max={databaseObj.primary.length} />
                                    <PoolBar icon={<Zap size={14} />} label="Secondary" count={poolStatus.secondary} max={databaseObj.secondary.length} />
                                    <PoolBar icon={<Skull size={14} />} label="Grenades" count={poolStatus.grenade} max={databaseObj.grenade.length} />
                                    <PoolBar icon={<Shield size={14} />} label="Armor" count={poolStatus.armor} max={databaseObj.armor.length} />
                                    <PoolBar icon={<Activity size={14} />} label="Boosters" count={poolStatus.boosterReady} max={databaseObj.booster.length} />
                                    <PoolBar icon={<Package size={14} />} label="Стратагемы" count={poolStatus.stratagems} max={databaseObj.stratagems.length} />
                                  </div>
                              ) : (
                                  <div className="steam-inset-box p-4 text-center flex-1 flex flex-col items-center justify-center gap-2">
                                      <RefreshCw size={40} className="text-hcAccent opacity-50 mb-2 drop-shadow-md" />
                                      <p className="text-sm text-hcText uppercase font-bold tracking-widest">Infinite Logistics</p>
                                      <p className="text-xs text-hcMuted max-w-[200px] leading-relaxed mt-2 border-t border-[var(--steam-border-dark)] pt-3">
                                          Super Earth command is providing endless, randomized equipment. Items will NOT deplete across missions.
                                      </p>
                                  </div>
                              )}
                              
                              {isHost && mode === 'chaos_attrition' && (
                                  <button onClick={handleResetPool} className="steam-tab-btn mt-3 w-full py-2 text-[10px] flex items-center justify-center gap-1 uppercase tracking-widest hover:text-hcRed transition-colors">
                                      <RefreshCw size={12} /> Reset Pool To Max
                                  </button>
                              )}
                          </div>
                      </div>

                      {/* Right Sidebar: Squad & Ready Controls */}
                      <div className="w-full md:w-1/2 flex flex-col gap-4">
                          <div className="steam-group-box pt-4 pb-3 px-3 flex-1 flex flex-col">
                              <span className="steam-group-box-title">Squad Readiness</span>
                              
                              <div className="steam-inset-box p-2 flex-1 flex flex-col justify-start mb-3 bg-hcDark/50 gap-1 overflow-y-auto">
                                  {playersArr.map((p, idx) => (
                                      <div key={p.uid} className={`flex items-center justify-between p-2.5 text-xs rounded border border-[var(--steam-border-dark)] w-full transition-colors ${p.uid === uid ? 'bg-hcPanel border-[var(--steam-border-light)]' : 'bg-transparent'}`}>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-hcMuted bg-[var(--steam-border-dark)] px-1.5 py-0.5 rounded font-mono">0{idx + 1}</span>
                                              <span className={`font-bold uppercase tracking-wider ${p.uid === uid ? 'text-hcAccent' : 'text-hcText'}`}>
                                                  {p.name} {p.uid === roomData.host && <span className="text-hcMuted text-[10px] lowercase tracking-normal bg-hcDark px-1 rounded ml-1">(Host)</span>}
                                              </span>
                                          </div>
                                          {p.isReady ? (
                                              <span className="text-hcDark bg-hcGreen px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-black uppercase tracking-widest shadow-[0_0_5px_rgba(56,255,100,0.5)]"><CheckCircle size={10} /> Ready</span>
                                          ) : (
                                              <span className="text-hcMuted text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">Ожидание</span>
                                          )}
                                      </div>
                                  ))}
                              </div>

                              <div className="flex flex-col gap-2 mt-auto">
                                  <button 
                                      onClick={handleReadyToggle}
                                      className={`steam-tab-btn py-3 font-bold uppercase tracking-widest flex items-center justify-center gap-2 w-full transition-all border shadow-sm ${
                                          isReady ? 'text-hcDark bg-hcGreen border-hcGreen shadow-[0_0_10px_rgba(56,255,100,0.3)]' : 'text-white hover:bg-hcPanel'
                                      }`}
                                  >
                                      <CheckCircle size={16} /> {isReady ? 'Deployed & Ready' : 'Готов'}
                                  </button>

                                  {isHost && (
                                      <button 
                                          onClick={handleRoll}
                                          disabled={!allReady}
                                          className="theme-button mt-1 py-4 bg-hcAccent hover:bg-yellow-400 text-hcDark font-black uppercase tracking-[0.2em] rounded flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed w-full shadow-md"
                                      >
                                          <PlayCircle size={20} /> Высадка (Сгенерировать)
                                      </button>
                                  )}
                                  
                                  {!isHost && (
                                      <div className="steam-inset-box p-3 text-center bg-hcDark border-dashed border-[var(--steam-border-dark)] mt-1">
                                          <span className="text-[10px] text-hcMuted uppercase tracking-widest animate-pulse font-bold">Awaiting Host Deployment...</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      );
  }

  // ------- DEPLOYED -------
  return (
      <div className="h-full w-full flex flex-col p-2 space-y-4 max-w-7xl mx-auto overflow-hidden">
          
          <div className="steam-dialog-header shrink-0 flex justify-between items-center text-sm px-3 py-2 bg-hcPanel border border-hcBorder shadow-md rounded">
             <div className="flex items-center gap-3">
                 <Skull size={18} className="text-hcAccent drop-shadow-md"/> 
                 <span className="uppercase tracking-widest font-bold text-white">Оперативники - Снаряжение сгенерировано</span>
             </div>
             {isHost && (
                 <button onClick={handleReturnToLobby} className="steam-tab-btn py-1 px-3 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 bg-hcDark hover:bg-hcPanel text-hcText transition-colors rounded">
                     <ArrowLeft size={14} /> Вернуться к брифингу
                 </button>
             )}
          </div>

          <div className="flex-1 overflow-y-auto px-1 custom-scrollbar pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
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

function PoolBar({ icon, label, count, max }) {
  const percent = Math.max(0, Math.min(100, (count / max) * 100));
  let colorClass = "bg-hcBlue";
  if (percent < 30) colorClass = "bg-hcRed";
  else if (percent < 60) colorClass = "bg-yellow-500";

  return (
    <div className="flex flex-col gap-1 w-full bg-[var(--steam-border-dark)]/30 p-1.5 rounded">
      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
        <span className="flex items-center gap-1.5 text-hcMuted">{icon} <span className="text-gray-300">{label}</span></span>
        <span className="text-hcText font-mono text-[10px] bg-hcDark px-1 rounded">{count} <span className="text-hcMuted">/ {max}</span></span>
      </div>
      <div className="w-full bg-hcDark h-[6px] rounded-sm overflow-hidden border border-[var(--steam-border-dark)]">
        <div className={`h-full ${colorClass} transition-all duration-500 shadow-[inset_0_1px_rgba(255,255,255,0.3)]`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function PlayerCard({ build, playerName }) {
  return (
    <div className="steam-group-box pt-7 pb-2 px-2 relative min-h-[280px] flex flex-col justify-between shadow-lg bg-hcPanel">
      <div className="absolute top-0 left-0 w-full h-[30px] bg-gradient-to-r from-[var(--steam-border-dark)] to-transparent -z-10 rounded-t border-b border-[var(--steam-border-dark)]"></div>
      <div className="absolute top-0 left-0 w-full px-2 pt-1 pb-1 flex items-center justify-between z-10">
           <span className="text-sm uppercase font-black text-white tracking-widest drop-shadow-md truncate">{playerName}</span>
           <span className="text-[10px] text-hcDark bg-hcAccent px-1.5 py-0.5 rounded font-black tracking-widest shadow-sm shrink-0">SLOT 0{build.playerIndex}</span>
      </div>

      <div className="steam-inset-box p-1.5 flex-1 flex flex-col gap-1.5 bg-[var(--color-bg-body)]">
          {/* НОВЫЙ PAPER-DOLL LAYOUT */}
          <div className="grid grid-cols-[1fr_auto_1fr] flex-1 gap-1.5 relative z-50 h-[150px]">
             
             {/* Left: Weapons */}
             <div className="flex flex-col gap-2 justify-center w-full">
                 <ItemSlot item={build.primary} label="Primary" />
                 <ItemSlot item={build.secondary} label="Secondary" />
             </div>
             
             {/* Center: Armor */}
             <div className="shrink-0 w-[100px] lg:w-[130px] relative mx-1">
                 <ArmorSlot item={build.armor} />
             </div>
             
             {/* Right: Gadgets */}
             <div className="flex flex-col gap-2 justify-center w-full">
                 {build.booster ? (
                      <div className="steam-inset-box flex flex-col items-center justify-start p-1 bg-hcPanel h-[72px] group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors hover:z-[60]">
                         <div className="h-14 w-full mb-1 flex items-center justify-center p-0.5 bg-hcDark/50 rounded-sm inset-shadow-sm border border-[var(--steam-border-dark)] overflow-hidden relative">
                             <img src={`/assets/images/${build.booster.imageURL}`} alt={build.booster.name} className="w-full h-full object-contain filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] transform scale-[1.3] group-hover:scale-[1.4] transition-transform" onError={(e) => e.target.style.display = 'none'} />
                         </div>
                         <span className="text-[9px] text-center text-hcMuted uppercase font-bold leading-[1.1] w-full line-clamp-2">{build.booster.name.replace("'", "")}</span>
                      </div>
                 ) : <EmptySlot label="Booster" />}
                 <ItemSlot item={build.grenade} label="Grenade" />
             </div>
          </div>

          <div className="flex flex-col w-full justify-end mt-2 pt-2 border-t border-[var(--steam-border-dark)]/50">
              <div className="grid grid-cols-4 gap-1.5 w-full">
                  {build.stratagems.map((strat, idx) => (
                      <StratagemSlot key={idx} strat={strat} />
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
}

function ItemSlot({ item, label }) {
    if (!item) return <EmptySlot label={label} />;
    return (
        <div className="steam-inset-box flex flex-col items-center justify-start p-1 bg-hcPanel h-[72px] relative group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors hover:z-[60]">
             <div className="h-14 w-full mb-1 flex items-center justify-center p-0.5 bg-hcDark/50 rounded-sm inset-shadow-sm border border-[var(--steam-border-dark)]">
                 <img src={`/assets/images/${item.imageURL}`} alt={item.name} className="w-[120%] h-[120%] object-contain filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] transform scale-[1.1]" onError={(e) => e.target.src = ''} />
             </div>
             <span className="text-[9px] text-center text-gray-300 uppercase font-bold leading-[1.1] line-clamp-2 w-full px-0.5 tracking-wide">{item.name.replace("'", "")}</span>
             <Tooltip text={item.name} />
        </div>
    );
}

function ArmorSlot({ item }) {
    if (!item) return <EmptySlot label="Armor" />;
    return (
        <div className="absolute inset-0 w-full h-full flex flex-col">
            <ArmorDisplay item={item} />
        </div>
    );
}

function StratagemSlot({ strat }) {
    if (!strat) return <div className="steam-inset-box aspect-[2.5/2] sm:aspect-[4/3] bg-hcPanel flex flex-col items-center justify-center text-[9px] text-[var(--steam-border-light)] uppercase font-bold border-dashed">Empty</div>;
    
    let borderColor = 'var(--steam-border-dark)';
    let bgColor = 'var(--color-bg-panel)';
    let glow = 'none';

    if (strat.tags.includes('blue') || strat.category === 'Supply' || strat.slotType.includes('Backpack') || strat.slotType.includes('Weapon')) {
        borderColor = 'rgba(56, 182, 255, 0.4)';
        bgColor = 'rgba(56, 182, 255, 0.05)';
        glow = '0 0 5px rgba(56, 182, 255, 0.2)';
    } else if (strat.category === 'Offensive' || strat.category === 'Eagle' || strat.category === 'Orbital') {
        borderColor = 'rgba(255, 56, 56, 0.4)';
        bgColor = 'rgba(255, 56, 56, 0.05)';
        glow = '0 0 5px rgba(255, 56, 56, 0.2)';
    } else if (strat.category === 'Defensive' || strat.tags.includes('Sentry')) {
        borderColor = 'rgba(56, 255, 100, 0.4)';
        bgColor = 'rgba(56, 255, 100, 0.05)';
        glow = '0 0 5px rgba(56, 255, 100, 0.2)';
    }

    return (
        <div className="steam-inset-box aspect-[2.5/2] sm:aspect-[4/3] flex items-center justify-center p-3 relative group cursor-help transition-all hover:brightness-125 hover:z-[60]" style={{ borderColor, backgroundColor: bgColor, boxShadow: glow }}>
             <img src={`/assets/stratagems/${strat.imageURL}`} alt={strat.name} className="w-[55%] h-[55%] object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" onError={(e) => e.target.src = ''} />
             <Tooltip text={`[${strat.slotType}] ${strat.name}`} />
        </div>
    );
}

function Tooltip({ text }) {
    return (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 steam-inset-box bg-[#1a1a1a] text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap z-[999] pointer-events-none transition-opacity shadow-[0_4px_10px_rgba(0,0,0,0.8)] border-[var(--steam-border-light)] font-bold tracking-wide">
            {text}
        </div>
    );
}

function EmptySlot({ label }) {
    return (
        <div className="steam-inset-box flex flex-col items-center justify-center p-1 bg-hcPanel border-red-900/30 border-dashed h-full w-full">
             <span className="text-[9px] text-[#555] uppercase tracking-widest font-bold">{label}</span>
             <span className="text-[10px] text-red-900/40 mt-1 font-black">UNAVAILABLE</span>
        </div>
    );
}
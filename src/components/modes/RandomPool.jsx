import React, { useState, useEffect } from 'react';
import useGameStore from '../../store/useGameStore';
import PoolGrid from '../draft/PoolGrid';
import DraftSlots from '../draft/DraftSlots';
import { db } from '../../utils/firebase';
import { ref, update } from 'firebase/database';
import { Skull, CheckCircle, RefreshCcw, Settings2, PlayCircle, Plus, Minus } from 'lucide-react';
import { initRandomPoolMode } from '../../utils/poolHelpers';
import databaseObj from '../../../database.json';

export default function RandomPool() {
    const { roomData, roomCode, uid, isHost } = useGameStore();

    const [activeTab, setActiveTab] = useState('primary');
    const [mobileView, setMobileView] = useState('pool');
    const [isConfiguring, setIsConfiguring] = useState(isHost && !roomData?.pool);

    const pool = roomData?.pool;
    const settings = roomData?.modeSettings || { playerCount: 4, missionCount: 3, currentMission: 1 };
    const players = roomData?.players || {};
    const uids = Object.keys(players);

    // Локальный стейт для настроек режима хостом
    const [configPlayers, setConfigPlayers] = useState(settings.playerCount);
    const [configMissions, setConfigMissions] = useState(settings.missionCount);

    const handleRebuildPool = async () => {
        if (!isHost) return;
        const warbondsLists = Object.values(players).map(p => p.warbonds || []);
        
        const rpData = initRandomPoolMode(databaseObj, warbondsLists, configPlayers, configMissions);
        
        await update(ref(db, `rooms/${roomCode}`), { 
            pool: rpData.pool,
            modeSettings: rpData.modeSettings
        });
        
        setIsConfiguring(false);
    };

    const getPlayerBuild = (playerUid) => {
        if (!pool) return { primary: null, secondary: null, grenade: null, armor: null, booster: null, stratagems: [] };

        const build = {
             primary: Object.values(pool.primary || {}).find(i => i.claimedBy === playerUid),
             secondary: Object.values(pool.secondary || {}).find(i => i.claimedBy === playerUid),
             grenade: Object.values(pool.grenade || {}).find(i => i.claimedBy === playerUid),
             armor: Object.values(pool.armor || {}).find(i => i.claimedBy === playerUid),
             booster: Object.values(pool.booster || {}).find(i => i.claimedBy === playerUid),
             stratagems: Object.values(pool.stratagems || {}).filter(i => i.claimedBy === playerUid)
        };
        
        while (build.stratagems.length < 4) build.stratagems.push(null);
        return build;
    };

    const handleReadyToggle = async () => {
        const isCurrentlyReady = players[uid]?.isReady || false;
        await update(ref(db, `rooms/${roomCode}/players/${uid}`), {
            isReady: !isCurrentlyReady
        });
    };

    const handleDeploy = async () => {
        if (!isHost) return;
        
        const updates = {};
        const categories = ['primary', 'secondary', 'grenade', 'armor', 'booster', 'stratagems'];
        
        // В режиме Random Pool после деплоя сжигаем взятые шмотки, как в CoopDraft
        categories.forEach(category => {
            if (!pool?.[category]) return;
            
            Object.entries(pool[category]).forEach(([itemKey, itemState]) => {
                if (itemState.claimedBy) {
                    updates[`rooms/${roomCode}/pool/${category}/${itemKey}`] = null;
                }
            });
        });

        // Сбрасываем флаги готовности
        uids.forEach(id => {
             updates[`rooms/${roomCode}/players/${id}/isReady`] = false;
        });
        
        // Увеличиваем счетчик миссий
        const nextMission = (settings.currentMission || 1) + 1;
        updates[`rooms/${roomCode}/modeSettings/currentMission`] = nextMission;

        await update(ref(db), updates);
    };

    const allReady = uids.length > 0 && uids.every(id => players[id]?.isReady);
    const myBuild = getPlayerBuild(uid);
    const isReady = players[uid]?.isReady;

    if (isConfiguring) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-120px)] w-full">
                <div className="bg-hcPanel border border-hcBorder rounded-lg p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-hcAccent mb-2 border-b border-hcBorder pb-2 flex items-center gap-2">
                        <Settings2 /> Настройки кампании
                    </h2>
                    <p className="text-sm text-hcMuted mb-6 font-mono">
                        Allocate initial supply limits based on operational duration and squad size. 
                        Resources are finite.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-hcMuted mb-2">Размер отряда</label>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setConfigPlayers(Math.max(1, configPlayers - 1))} className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center theme-inner-panel hover:border-hcAccent rounded"><Minus size={16} /></button>
                                <span className="text-2xl font-black font-mono w-8 text-center text-hcText">{configPlayers}</span>
                                <button onClick={() => setConfigPlayers(Math.min(4, configPlayers + 1))} className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center theme-inner-panel hover:border-hcAccent rounded"><Plus size={16} /></button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-hcMuted mb-2">Длительность операции (Миссии)</label>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setConfigMissions(Math.max(1, configMissions - 1))} className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center theme-inner-panel hover:border-hcAccent rounded"><Minus size={16} /></button>
                                <span className="text-2xl font-black font-mono w-8 text-center text-hcText">{configMissions}</span>
                                <button onClick={() => setConfigMissions(Math.min(10, configMissions + 1))} className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center theme-inner-panel hover:border-hcAccent rounded"><Plus size={16} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-hcBorder">
                        <button 
                            onClick={handleRebuildPool}
                            className="w-full py-4 theme-button text-hcDark font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-transform transform active:scale-95"
                        >
                            <PlayCircle size={20} /> Сгенерировать арсенал кампании
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-[1600px] w-full mx-auto">
            
            {/* Mobile View Toggle */}
            <div className="lg:hidden flex shrink-0 mb-4 bg-hcPanel rounded-lg overflow-hidden border border-hcBorder">
                <button 
                    className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-widest min-h-[44px] transition-colors ${mobileView === 'pool' ? 'bg-hcAccent text-hcDark' : 'bg-transparent text-hcMuted hover:text-white'}`}
                    onClick={() => setMobileView('pool')}
                >
                    Arsenal Pool
                </button>
                <button 
                    className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-widest min-h-[44px] transition-colors ${mobileView === 'squad' ? 'bg-hcAccent text-hcDark' : 'bg-transparent text-hcMuted hover:text-white'}`}
                    onClick={() => setMobileView('squad')}
                >
                    Squad Loadouts
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                {/* Left side: The Limited Pool (Vitrine) */}
                <div className={`flex-1 flex-col theme-inner-panel border border-hcBorder rounded-lg overflow-hidden ${mobileView === 'pool' ? 'flex' : 'hidden lg:flex'}`}>
                    {/* Stats Header for Random Pool */}
                    <div className="bg-hcDark border-b border-hcBorder p-3 flex justify-between items-center px-4 flex-wrap gap-2">
                        <div>
                            <span className="text-xs uppercase tracking-widest text-hcMuted">Operation Status: </span>
                            <span className="font-bold text-hcText uppercase tracking-widest">
                                Mission {settings.currentMission} / {settings.missionCount}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-xs uppercase tracking-widest text-hcMuted">Squad Size: </span>
                                <span className="font-bold text-hcAccent">{settings.playerCount}</span>
                            </div>
                            {isHost && (
                                <button 
                                    onClick={() => setIsConfiguring(true)}
                                    className="px-3 py-1.5 text-[10px] min-h-[44px] sm:min-h-[32px] text-hcMuted uppercase font-bold flex items-center gap-2 hover:text-white border border-hcBorder hover:border-gray-400 rounded transition-colors bg-hcDark"
                                    title="Reconfigure Campaign & Reset Pool"
                                >
                                    <Settings2 size={12} /> <span className="hidden sm:inline">Campaign Settings</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-hcPanel border-b border-hcBorder overflow-x-auto custom-scrollbar snap-x">
                        {['primary', 'secondary', 'grenade', 'armor', 'booster', 'stratagems'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 sm:px-6 py-3 min-h-[44px] min-w-[80px] text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors snap-start ${
                                    activeTab === tab 
                                    ? 'border-hcAccent text-hcAccent bg-hcDark/50' 
                                    : 'border-transparent text-hcMuted hover:text-gray-300 hover:bg-hcDark/30'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <PoolGrid category={activeTab} poolSection={pool?.[activeTab]} />
                    </div>
                </div>

                {/* Right side: Squad Slots & Controls */}
                <div className={`w-full lg:w-[400px] flex-col gap-4 overflow-hidden ${mobileView === 'squad' ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* My Control Panel */}
                    <div className="bg-hcPanel border border-hcBorder rounded-lg p-4 flex flex-col gap-3 shadow-lg shrink-0">
                        <div className="text-center font-bold text-hcMuted uppercase tracking-widest text-xs border-b border-hcBorder pb-2 flex justify-between items-center">
                            <span>Resource Allocation</span>
                            {settings.currentMission > settings.missionCount && (
                                <span className="text-[10px] text-hcRed bg-red-900/20 px-2 py-1 rounded">OVERTIME</span>
                            )}
                        </div>
                        
                        <button 
                            onClick={handleReadyToggle}
                            className={`py-3 min-h-[44px] rounded font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                isReady 
                                ? 'bg-hcGreen/20 text-hcGreen border border-hcGreen hover:bg-hcGreen/30' 
                                : 'bg-hcDark border border-hcBorder text-hcMuted hover:border-gray-400 hover:text-white'
                            }`}
                        >
                            <CheckCircle size={18} /> {isReady ? 'Ready for Deployment' : 'Confirm Loadout'}
                        </button>

                        {isHost && (
                            <button 
                                onClick={handleDeploy}
                                disabled={!allReady}
                                className="py-4 min-h-[44px] theme-button text-hcDark font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-transform transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-md mt-2"
                            >
                                <Skull size={20} /> Burn Loadouts & Deploy
                            </button>
                        )}
                    </div>

                    {/* Squad Loadouts */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
                        <DraftSlots build={myBuild} isMe={true} playerName={players[uid]?.name} />
                        
                        {uids.filter(id => id !== uid).map(otherUid => (
                            <DraftSlots 
                                key={otherUid} 
                                build={getPlayerBuild(otherUid)} 
                                isMe={false} 
                                playerName={players[otherUid]?.name} 
                            />
                        ))}
                    </div>

                </div>

            </div>
        </div>
    );
}
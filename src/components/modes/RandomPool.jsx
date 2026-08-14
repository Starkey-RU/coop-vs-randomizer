import React, { useState } from 'react';
import useGameStore from '../../store/useGameStore';
import RoomActions from '../../store/RoomActions';
import PoolGrid from '../draft/PoolGrid';
import DraftSlots from '../draft/DraftSlots';
import OperationPanel from '../draft/OperationPanel';
import HistoryModal from '../common/HistoryModal';
import { getPlayerBuild } from '../../utils/poolHelpers';
import SteamInset from '../ui/SteamInset';
import SteamButton from '../ui/SteamButton';

export default function RandomPool() {
    const { roomData, roomCode, uid, isHost } = useGameStore();

    const [activeTab, setActiveTab] = useState('primary');
    const [mobileView, setMobileView] = useState('pool');
    const [isConfiguring, setIsConfiguring] = useState(isHost && !roomData?.pool);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const pool = roomData?.pool;
    const settings = roomData?.modeSettings || { playerCount: 4, missionCount: 3, currentMission: 1 };
    const players = roomData?.players || {};
    const history = roomData?.history || {};
    const uids = Object.keys(players);

    // Local state for campaign configuration
    const [configPlayers, setConfigPlayers] = useState(settings.playerCount);
    const [configMissions, setConfigMissions] = useState(settings.missionCount);

    const handleRebuildPool = async () => {
        if (!isHost) return;
        await RoomActions.rebuildRandomPool(roomCode, players, configPlayers, configMissions);
        setIsConfiguring(false);
    };

    const handleDeploy = async () => {
        if (!isHost) return;
        await RoomActions.deployRandomPool(roomCode, pool, players, settings, history);
    };

    const handleSelectCategory = (cat) => {
        setActiveTab(cat);
        setMobileView('pool');
    };

    const myBuild = getPlayerBuild(pool, uid);

    if (isConfiguring) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full font-mono p-2">
                <SteamInset className="p-6 max-w-lg w-full text-center">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-hcAccent mb-2 border-b border-[var(--steam-border-dark)] pb-2">
                        [ НАСТРОЙКИ КАМПАНИИ // RANDOM POOL ]
                    </h2>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Выделите лимиты логистики на основе размера отряда и длительности операции. Ресурсы ограничены на всю кампанию.
                    </p>

                    <div className="space-y-4 mb-6 text-left">
                        <div className="bg-black/30 p-2.5 border border-[var(--steam-border-dark)]">
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-bold">Размер отряда (бойцов):</label>
                            <div className="flex items-center gap-3">
                                <SteamButton variant="tab" onClick={() => setConfigPlayers(Math.max(1, configPlayers - 1))} className="px-3 py-1 text-xs font-bold font-mono">[ - ]</SteamButton>
                                <span className="text-lg font-bold font-mono w-8 text-center text-hcAccent">{configPlayers}</span>
                                <SteamButton variant="tab" onClick={() => setConfigPlayers(Math.min(4, configPlayers + 1))} className="px-3 py-1 text-xs font-bold font-mono">[ + ]</SteamButton>
                            </div>
                        </div>

                        <div className="bg-black/30 p-2.5 border border-[var(--steam-border-dark)]">
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-bold">Длительность операции (миссий):</label>
                            <div className="flex items-center gap-3">
                                <SteamButton variant="tab" onClick={() => setConfigMissions(Math.max(1, configMissions - 1))} className="px-3 py-1 text-xs font-bold font-mono">[ - ]</SteamButton>
                                <span className="text-lg font-bold font-mono w-8 text-center text-hcAccent">{configMissions}</span>
                                <SteamButton variant="tab" onClick={() => setConfigMissions(Math.min(10, configMissions + 1))} className="px-3 py-1 text-xs font-bold font-mono">[ + ]</SteamButton>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--steam-border-dark)]">
                        <SteamButton 
                            variant="primary"
                            onClick={handleRebuildPool}
                            className="w-full py-2.5 text-xs font-bold uppercase tracking-wider"
                        >
                            [ СГЕНЕРИРОВАТЬ АРСЕНАЛ КАМПАНИИ ]
                        </SteamButton>
                    </div>
                </SteamInset>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-95px)] max-w-[1600px] w-full mx-auto font-mono">
            
            {/* Mobile View Toggle */}
            <div className="lg:hidden flex shrink-0 mb-2 border border-[var(--steam-border-dark)] bg-hcDark">
                <button 
                    className={`flex-1 py-2 px-2 text-xs font-bold uppercase tracking-wider transition-colors ${mobileView === 'pool' ? 'bg-hcAccent text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setMobileView('pool')}
                >
                    [ АРСЕНАЛ ]
                </button>
                <button 
                    className={`flex-1 py-2 px-2 text-xs font-bold uppercase tracking-wider transition-colors ${mobileView === 'squad' ? 'bg-hcAccent text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setMobileView('squad')}
                >
                    [ СНАРЯЖЕНИЕ ОТРЯДА ]
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 flex-1 overflow-hidden">
                {/* Left side: The Limited Pool (Vitrine) */}
                <div className={`flex-1 flex-col overflow-hidden ${mobileView === 'pool' ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* Campaign Status Bar */}
                    <div className="bg-black/40 border-b border-[var(--steam-border-dark)] px-3 py-1.5 flex justify-between items-center text-xs shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">МИССИЯ:</span>
                            <span className="text-hcAccent font-bold">{settings.currentMission} / {settings.missionCount}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-400">ОТРЯД:</span>
                            <span className="text-slate-200 font-bold">{settings.playerCount} БОЙЦА</span>
                        </div>
                        {isHost && (
                            <SteamButton 
                                variant="tab"
                                onClick={() => setIsConfiguring(true)}
                                className="px-2 py-0.5 text-[9px] font-bold text-slate-300 hover:text-white uppercase"
                            >
                                [ НАСТРОЙКИ КАМПАНИИ ]
                            </SteamButton>
                        )}
                    </div>

                    {/* Steam 2003 Tab Strip */}
                    <div className="flex pt-1 px-1 bg-[var(--steam-border-dark,#111)] border-b border-[var(--steam-border-light,#444)] overflow-x-auto custom-scrollbar shrink-0">
                        {['primary', 'secondary', 'grenade', 'armor', 'booster', 'stratagems'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`steam-tab-btn uppercase font-mono font-bold tracking-wider text-[11px] px-3.5 py-1.5 transition-colors ${
                                    activeTab === tab ? 'active' : ''
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <SteamInset className="flex-1 overflow-y-auto p-2.5 custom-scrollbar border-t-0">
                        <PoolGrid category={activeTab} poolSection={pool?.[activeTab]} />
                    </SteamInset>
                </div>

                {/* Right side: Squad Slots & Controls */}
                <div className={`w-full lg:w-[380px] flex-col gap-2 overflow-hidden shrink-0 ${mobileView === 'squad' ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* Standard Steam Operation Panel */}
                    <OperationPanel 
                        pool={pool} 
                        players={players} 
                        roomCode={roomCode} 
                        uid={uid} 
                        isHost={isHost} 
                        roomOptions={settings} 
                        onDeploy={handleDeploy} 
                        onOpenHistory={() => setIsHistoryOpen(true)} 
                    />

                    {/* Squad Loadouts */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
                        <DraftSlots build={myBuild} isMe={true} playerName={players[uid]?.name} isReady={players[uid]?.isReady} onSelectCategory={handleSelectCategory} />
                        
                        {uids.filter(id => id !== uid).map(otherUid => (
                            <DraftSlots 
                                key={otherUid} 
                                build={getPlayerBuild(pool, otherUid)} 
                                isMe={false} 
                                playerName={players[otherUid]?.name} 
                                isReady={players[otherUid]?.isReady}
                                onSelectCategory={handleSelectCategory}
                            />
                        ))}
                    </div>

                </div>

            </div>

            <HistoryModal 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
                history={history} 
            />
        </div>
    );
}
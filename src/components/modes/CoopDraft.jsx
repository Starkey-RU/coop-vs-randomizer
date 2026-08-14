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

export default function CoopDraft() {
    const { roomData, roomCode, uid, isHost } = useGameStore();

    // Текущая выбранная вкладка-категория для витрины
    const [activeTab, setActiveTab] = useState('primary');
    const [mobileView, setMobileView] = useState('pool');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const pool = roomData?.pool;
    const players = roomData?.players || {};
    const roomOptions = roomData?.options || {};
    const history = roomData?.history || {};
    const uids = Object.keys(players);

    const handleStartDraft = async () => {
        if (!isHost) return;
        await RoomActions.startDraft(roomCode, players);
    };

    const handleDeploy = async () => {
        if (!isHost) return;
        await RoomActions.deployCoopDraft(roomCode, pool, roomOptions, players, history);
    };

    const handleSelectCategory = (cat) => {
        setActiveTab(cat);
        setMobileView('pool');
    };

    const myBuild = getPlayerBuild(pool, uid);

    // Экран ожидания отряда перед началом драфта
    if (!pool) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full">
                <SteamInset className="p-6 max-w-lg w-full text-center">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-hcAccent mb-2 border-b border-[var(--steam-border-dark)] pb-2 font-mono">
                        [ SQUAD LOBBY // ATTRITION ]
                    </h2>
                    <p className="text-xs text-slate-400 mb-5 font-mono">
                        Ожидание участников отряда. Арсенал миссии будет сформирован на основе открытых варбондов подключенных бойцов.
                    </p>

                    <div className="space-y-2 mb-6">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block text-left font-mono">
                            ПОДКЛЮЧЕННЫЕ БОЙЦЫ ({uids.length}/4):
                        </span>
                        {Object.values(players).map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-black/40 border border-[var(--steam-border-dark)]">
                                <span className="font-bold text-slate-200 uppercase text-xs font-mono">{p.name}</span>
                                <span className="text-[10px] text-hcAccent font-mono bg-black/60 border border-hcAccent/30 px-2 py-0.5">
                                    ВАРБОНДОВ: {p.warbonds ? p.warbonds.length : 0}
                                </span>
                            </div>
                        ))}
                    </div>

                    {isHost ? (
                        <SteamButton 
                            variant="primary"
                            onClick={handleStartDraft}
                            className="w-full py-2.5 text-xs font-bold font-mono uppercase tracking-wider"
                        >
                            [ НАЧАТЬ ДРАФТ АРСЕНАЛА ]
                        </SteamButton>
                    ) : (
                        <div className="p-3 bg-black/40 border border-[var(--steam-border-dark)] text-center font-mono">
                            <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
                                ОЖИДАНИЕ ХОСТА... ОТРЯД ГОТОВИТСЯ К ВЫСАДКЕ
                            </span>
                        </div>
                    )}
                </SteamInset>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-95px)] max-w-[1600px] w-full mx-auto">
            {/* Mobile View Toggle */}
            <div className="lg:hidden flex shrink-0 mb-2 border border-[var(--steam-border-dark)] bg-hcDark">
                <button 
                    className={`flex-1 py-2 px-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${mobileView === 'pool' ? 'bg-hcAccent text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setMobileView('pool')}
                >
                    [ АРСЕНАЛ ]
                </button>
                <button 
                    className={`flex-1 py-2 px-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${mobileView === 'squad' ? 'bg-hcAccent text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setMobileView('squad')}
                >
                    [ СНАРЯЖЕНИЕ ОТРЯДА ]
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 flex-1 overflow-hidden">
                {/* Left side: The Live Pool (Vitrine) */}
                <div className={`flex-1 flex-col overflow-hidden ${mobileView === 'pool' ? 'flex' : 'hidden lg:flex'}`}>
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

                    {/* Steam Inset Content Container */}
                    <SteamInset className="flex-1 overflow-y-auto p-2.5 custom-scrollbar border-t-0">
                        <PoolGrid category={activeTab} poolSection={pool?.[activeTab]} />
                    </SteamInset>
                </div>

                {/* Right side: Squad Slots & Controls */}
                <div className={`w-full lg:w-[380px] flex-col gap-2 overflow-hidden shrink-0 ${mobileView === 'squad' ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* My Control Panel */}
                    <OperationPanel 
                        pool={pool} 
                        players={players} 
                        roomCode={roomCode} 
                        uid={uid} 
                        isHost={isHost} 
                        roomOptions={roomOptions} 
                        onDeploy={handleDeploy} 
                        onOpenHistory={() => setIsHistoryOpen(true)} 
                    />

                    {/* Squad Loadouts */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
                        {/* Сначала рисуем себя, потом остальных */}
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
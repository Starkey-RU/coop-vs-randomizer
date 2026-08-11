import React, { useState } from 'react';
import useGameStore from '../../store/useGameStore';
import PoolGrid from '../draft/PoolGrid';
import DraftSlots from '../draft/DraftSlots';
import OperationPanel from '../draft/OperationPanel';
import HistoryModal from '../common/HistoryModal';
import { db } from '../../utils/firebase';
import { ref, update } from 'firebase/database';
import { Users, PlayCircle } from 'lucide-react';
import { initPoolForFirebase, buildDeployUpdates, buildHistorySnapshot, getPlayerBuild } from '../../utils/poolHelpers';
import databaseObj from '../../../database.json';

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
        const warbondsLists = Object.values(players).map(p => p.warbonds || []);
        const newPool = initPoolForFirebase(databaseObj, warbondsLists);

        await update(ref(db, `rooms/${roomCode}`), {
            pool: newPool
        });
    };

    const handleDeploy = async () => {
        if (!isHost) return;

        const currentMissionCount = Object.keys(history).length + 1;
        const squadSnapshot = buildHistorySnapshot(pool, players);
        
        const updates = buildDeployUpdates(pool, roomCode, roomOptions, uids);
        updates[`rooms/${roomCode}/history/mission_${currentMissionCount}`] = {
            timestamp: Date.now(),
            missionNumber: currentMissionCount,
            squadLoadouts: squadSnapshot
        };

        await update(ref(db), updates);
    };

    const handleSelectCategory = (cat) => {
        setActiveTab(cat);
        setMobileView('pool');
    };

    const myBuild = getPlayerBuild(pool, uid);
    const isReady = players[uid]?.isReady;

    // Экран ожидания отряда перед началом драфта
    if (!pool) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-120px)] w-full">
                <div className="bg-hcPanel border border-hcBorder rounded-lg p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 text-center">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-hcAccent mb-2 border-b border-hcBorder pb-2 flex items-center justify-center gap-2">
                        <Users /> Squad Lobby (Co-op Draft)
                    </h2>
                    <p className="text-xs text-hcMuted mb-6 font-mono">
                        Дождитесь подключения всех участников отряда. Арсенал будет сформирован на основе открытых варбондов всех зашедших игроков.
                    </p>

                    <div className="space-y-3 mb-8">
                        <span className="text-xs font-bold text-hcMuted uppercase tracking-widest block text-left">
                            Подключенные бойцы ({uids.length}/4):
                        </span>
                        {Object.values(players).map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 theme-inner-panel rounded border border-hcBorder">
                                <span className="font-bold text-white uppercase text-sm">{p.name}</span>
                                <span className="text-[10px] text-hcAccent font-mono bg-hcDark border border-hcAccent/30 px-2 py-0.5 rounded">
                                    Варбондов: {p.warbonds ? p.warbonds.length : 0}
                                </span>
                            </div>
                        ))}
                    </div>

                    {isHost ? (
                        <button 
                            onClick={handleStartDraft}
                            className="w-full py-4 bg-hcAccent hover:bg-yellow-400 text-hcDark font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-transform transform active:scale-95 shadow-lg"
                        >
                            <PlayCircle size={20} /> Сгенерировать арсенал и начать драфт
                        </button>
                    ) : (
                        <div className="p-4 bg-hcDark rounded border border-hcAccent/30 text-center animate-pulse">
                            <span className="text-xs text-hcMuted uppercase tracking-widest font-bold">Ожидание хоста... Отряд готовится к десантированию</span>
                        </div>
                    )}
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
                {/* Left side: The Live Pool (Vitrine) */}
                <div className={`flex-1 flex-col theme-inner-panel border border-hcBorder rounded-lg overflow-hidden ${mobileView === 'pool' ? 'flex' : 'hidden lg:flex'}`}>
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
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
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
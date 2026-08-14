import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import ChaosMode from '../components/modes/ChaosMode';
import CoopDraft from '../components/modes/CoopDraft';
import RandomPool from '../components/modes/RandomPool';
import SteamWindow from '../components/ui/SteamWindow';
import SteamInset from '../components/ui/SteamInset';
import SteamButton from '../components/ui/SteamButton';

const Room = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { joinRoom, leaveRoom, roomData, roomCode, name } = useGameStore();

    useEffect(() => {
        if (!roomCode || roomCode !== id || !roomData) {
             if (name.trim()) {
                 joinRoom(id).catch((err) => {
                     console.error("Join room error:", err);
                     alert("Operation not found.");
                     navigate('/');
                 });
             } else {
                 navigate('/');
             }
        }
    }, [id, roomCode]);

    const handleLeave = () => {
        leaveRoom();
        navigate('/');
    };

    if (!roomData) {
        return (
            <div className="min-h-screen bg-hcDark text-hcText flex flex-col items-center justify-center font-mono">
                <h2 className="text-sm font-bold uppercase tracking-widest text-hcMuted">[ ПОДКЛЮЧЕНИЕ К COMMLINK... ]</h2>
            </div>
        );
    }

    const modeName = (roomData.mode || '').replace('_', ' ').toUpperCase();

    return (
        <SteamWindow className="h-screen overflow-hidden text-hcText flex flex-col p-1.5 sm:p-2 bg-hcDark">
            {/* Steam 2003 Dialog Header Bar */}
            <div className="steam-dialog-header shrink-0 flex items-center justify-between font-mono">
                <span>Steam CommLink — Operation {id} [{modeName}]</span>
                <button 
                    onClick={handleLeave} 
                    className="px-1.5 py-0.5 text-[10px] font-mono hover:bg-red-900/60 text-slate-300 hover:text-white border border-transparent hover:border-red-500" 
                    title="Выйти в главное меню"
                >
                    [X]
                </button>
            </div>

            {/* Top Tactical Navigation & Status Bar */}
            <SteamInset className="p-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1.5 shrink-0 gap-2 w-full box-border">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <SteamButton 
                         variant="primary"
                         onClick={handleLeave}
                         className="px-2.5 py-1 text-xs font-mono font-bold tracking-wider"
                    >
                        [ НАЗАД ]
                    </SteamButton>

                    <div className="flex items-center gap-2 font-mono text-[11px] leading-tight">
                        <span className="text-slate-400">ОПЕРАЦИЯ:</span>
                        <span className="text-hcAccent font-bold">{id}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400">РЕЖИМ:</span>
                        <span className="text-sky-400 font-bold">{modeName}</span>
                    </div>
                </div>

                {/* Squad Readiness Badges */}
                <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto custom-scrollbar">
                    {Object.entries(roomData.players || {}).map(([playerUid, player]) => {
                        const isHost = playerUid === roomData.host;
                        const isReady = Boolean(player.isReady);
                        return (
                            <div 
                                key={playerUid} 
                                className={`px-2 py-0.5 flex items-center gap-1 text-[10px] font-mono whitespace-nowrap border ${
                                    isReady 
                                        ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300' 
                                        : 'bg-black/40 border-slate-700/60 text-slate-400'
                                }`}
                            >
                                <span className={isReady ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                    {isReady ? '[✓]' : '[...]'}
                                </span>
                                <span className={isHost ? 'text-hcAccent font-bold' : 'text-slate-200'}>
                                    {player.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </SteamInset>

            <div className="flex-1 overflow-hidden">
                {(roomData.mode === 'chaos' || roomData.mode === 'chaos_random' || roomData.mode === 'chaos_attrition') && <ChaosMode />}
                {(roomData.mode === 'coop' || roomData.mode === 'attrition') && <CoopDraft />}
                {roomData.mode === 'random_pool' && <RandomPool />}
            </div>
        </SteamWindow>
    );
};

export default Room;

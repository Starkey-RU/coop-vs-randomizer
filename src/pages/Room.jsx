import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import ChaosMode from '../components/modes/ChaosMode';
import CoopDraft from '../components/modes/CoopDraft';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import RandomPool from '../components/modes/RandomPool';

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
            <div className="min-h-screen bg-hcDark text-hcText flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-hcAccent mb-4" size={48} />
                <h2 className="text-xl font-bold uppercase tracking-widest text-hcMuted">Connecting to CommLink...</h2>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden theme-panel bg-hcDark text-hcText flex flex-col p-2">
            {/* Steam 2003 Dialog Header Bar */}
            <div className="steam-dialog-header shrink-0">
                <span>Steam CommLink — Operation {id} [{(roomData.mode || '').replace('_', ' ').toUpperCase()}]</span>
                <div className="flex items-center gap-1">
                    <button onClick={handleLeave} className="px-1 py-0.2 hover:text-white" title="Вернуться в меню"><ArrowLeft size={12} /></button>
                </div>
            </div>

            {/* Top Navigation & Status Bar */}
            <div className="steam-inset-box theme-inner-panel p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 shrink-0 gap-2 w-full box-border">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <button 
                         onClick={handleLeave}
                         className="theme-button px-3 min-h-[44px] text-xs font-bold flex items-center justify-center gap-1 rounded"
                    >
                        <ArrowLeft size={16} /> Назад
                    </button>
                    <div className="text-right sm:text-left flex-1">
                        <h1 className="text-sm sm:text-xs font-bold uppercase tracking-wider text-hcText flex items-center justify-end sm:justify-start gap-2">
                            Operation <span className="theme-highlight truncate max-w-[100px] sm:max-w-none">{id}</span>
                        </h1>
                        <p className="text-[11px] sm:text-[10px] text-hcMuted font-mono truncate">
                            Режим: <span className="text-hcBlue font-bold">{(roomData.mode || '').replace('_', ' ')}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                    <div className="steam-inset-box flex flex-row p-1 gap-1 theme-inner-panel min-w-min">
                        {Object.entries(roomData.players || {}).map(([playerUid, player]) => (
                             <div 
                                key={playerUid} 
                                className={`px-2 py-1 min-h-[32px] sm:min-h-[auto] flex items-center gap-1 text-[11px] sm:text-[10px] font-bold whitespace-nowrap rounded ${playerUid === roomData.host ? 'theme-highlight font-bold' : 'text-hcMuted'}`}
                             >
                                 {player.isReady && <ShieldCheck size={12} className="text-hcGreen shrink-0" />}
                                 {player.name}
                             </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {(roomData.mode === 'chaos' || roomData.mode === 'chaos_random' || roomData.mode === 'chaos_attrition') && <ChaosMode />}
                {(roomData.mode === 'coop' || roomData.mode === 'attrition') && <CoopDraft />}
                {roomData.mode === 'random_pool' && <RandomPool />}
            </div>
        </div>
    );
};

export default Room;

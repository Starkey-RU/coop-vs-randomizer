import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import RoomActions from '../store/RoomActions';
import ChaosMode from '../components/modes/ChaosMode';
import CoopDraft from '../components/modes/CoopDraft';
import RandomPool from '../components/modes/RandomPool';
import SteamWindow from '../components/ui/SteamWindow';
import SteamInset from '../components/ui/SteamInset';
import SteamButton from '../components/ui/SteamButton';

const Room = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { joinRoom, leaveRoom, roomData, roomCode, name, isHost } = useGameStore();

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

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

    const handleStartEdit = () => {
        setEditedName(roomData?.roomName || `Операция ${id}`);
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        if (editedName.trim()) {
            await RoomActions.updateRoomName(id, editedName.trim());
        }
        setIsEditingName(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSaveName();
        if (e.key === 'Escape') setIsEditingName(false);
    };

    if (!roomData) {
        return (
            <div className="min-h-screen bg-hcDark text-hcText flex flex-col items-center justify-center font-mono">
                <h2 className="text-sm font-bold uppercase tracking-widest text-hcMuted">[ ПОДКЛЮЧЕНИЕ К COMMLINK... ]</h2>
            </div>
        );
    }

    const modeName = (roomData.mode || '').replace('_', ' ').toUpperCase();
    const currentRoomName = roomData.roomName || `Операция ${id}`;

    return (
        <SteamWindow className="h-screen overflow-hidden text-hcText flex flex-col p-1.5 sm:p-2 bg-hcDark">
            {/* Steam 2003 Dialog Header Bar */}
            <div className="steam-dialog-header shrink-0 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2 truncate">
                    <span>Steam CommLink — {currentRoomName} [{modeName}]</span>
                </div>
                <button 
                    onClick={handleLeave} 
                    className="px-1.5 py-0.5 text-[10px] font-mono hover:bg-red-900/60 text-slate-300 hover:text-white border border-transparent hover:border-red-500 shrink-0" 
                    title="Выйти в главное меню"
                >
                    [X]
                </button>
            </div>

            {/* Top Tactical Navigation & Status Bar */}
            <SteamInset className="p-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1.5 shrink-0 gap-2 w-full box-border">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <SteamButton 
                         variant="primary"
                         onClick={handleLeave}
                         className="px-2.5 py-1 text-xs font-mono font-bold tracking-wider shrink-0"
                    >
                        [ НАЗАД ]
                    </SteamButton>

                    {/* Room Title with Inline Edit for Host */}
                    {isEditingName ? (
                        <div className="flex items-center gap-1 bg-black/60 border border-[var(--steam-border-dark)] p-0.5 font-mono">
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="bg-black/90 text-hcAccent text-[11px] px-1.5 py-0.5 outline-none font-bold border border-hcAccent/50 max-w-[200px]"
                                maxLength={40}
                            />
                            <SteamButton variant="primary" onClick={handleSaveName} className="px-1.5 py-0.5 text-[10px]">[ ОК ]</SteamButton>
                            <SteamButton variant="tab" onClick={() => setIsEditingName(false)} className="px-1.5 py-0.5 text-[10px]">[ X ]</SteamButton>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] leading-tight bg-black/40 px-2 py-1 border border-[var(--steam-border-dark)]">
                            <span className="text-slate-400">ЛОББИ:</span>
                            <span className="text-hcAccent font-bold truncate max-w-[200px] sm:max-w-[300px]" title={currentRoomName}>
                                {currentRoomName}
                            </span>
                            {isHost && (
                                <button
                                    onClick={handleStartEdit}
                                    className="text-[9px] text-slate-400 hover:text-white ml-1 underline uppercase font-bold"
                                    title="Изменить название лобби"
                                >
                                    [изм]
                                </button>
                            )}
                            <span className="text-slate-600 mx-0.5">|</span>
                            <span className="text-slate-400">ID:</span>
                            <span className="text-slate-200 font-bold">{id}</span>
                            <span className="text-slate-600 mx-0.5">|</span>
                            <span className="text-slate-400">РЕЖИМ:</span>
                            <span className="text-sky-400 font-bold">{modeName}</span>
                        </div>
                    )}
                </div>

                {/* Squad Readiness Badges */}
                <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto custom-scrollbar shrink-0">
                    {Object.entries(roomData.players || {}).map(([playerUid, player]) => {
                        const isPlayerHost = playerUid === roomData.host;
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
                                <span className={isPlayerHost ? 'text-hcAccent font-bold' : 'text-slate-200'}>
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

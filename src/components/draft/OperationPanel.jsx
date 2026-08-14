import React, { useState } from 'react';
import RoomActions from '../../store/RoomActions';
import { getFilledCount, getMaxPossibleSlots } from '../../utils/poolHelpers';
import SteamWindow from '../ui/SteamWindow';
import SteamBox from '../ui/SteamBox';
import SteamInset from '../ui/SteamInset';
import SteamButton from '../ui/SteamButton';

export default function OperationPanel({ pool, players, roomCode, uid, isHost, roomOptions, onDeploy, onOpenHistory }) {
    const [showOptions, setShowOptions] = useState(false);
    const uids = Object.keys(players || {});
    const myPlayer = players[uid];
    const isReady = myPlayer?.isReady || false;
    const missionNumber = (roomOptions?.historyLength || 0) + 1;

    const handleToggleDepleteBoosters = () => {
        if (!isHost) return;
        RoomActions.updateRoomOption(roomCode, 'depleteBoosters', !roomOptions?.depleteBoosters);
    };

    const toggleReady = async () => {
        await RoomActions.toggleReadyStatus(roomCode, uid, !isReady);
    };

    const handleForceReady = async (pUid) => {
        if (!isHost) return;
        await RoomActions.toggleReadyStatus(roomCode, pUid, !players[pUid]?.isReady);
    };

    const handleKickPlayer = async (pUid) => {
        if (!isHost) return;
        if (window.confirm(`Исключить бойца ${players[pUid]?.name || ''} и вернуть его экипировку в пул?`)) {
            await RoomActions.kickPlayer(roomCode, pUid, pool);
        }
    };

    const handleDeployClick = () => {
        if (!isHost) return;
        onDeploy();
    };

    const readyCount = uids.filter(id => players[id]?.isReady).length;
    const allReady = uids.length > 0 && readyCount === uids.length;

    let filled = 0, maxSlots = 0;
    if (myPlayer) {
        filled = getFilledCount(pool, uid);
        maxSlots = getMaxPossibleSlots(pool, uid);
    }
    const isLoadoutComplete = filled >= maxSlots && maxSlots > 0;
    const readyPercent = uids.length > 0 ? Math.round((readyCount / uids.length) * 100) : 0;

    return (
        <SteamWindow className="flex flex-col gap-2 relative shrink-0 p-1.5">
            {/* Header: VGUI2 Steam Title Bar */}
            <div className="steam-dialog-header">
                <div className="flex items-center gap-2">
                    <span className="font-bold tracking-wider text-[11px]">
                        ОПЕРАЦИЯ // МИССИЯ #{missionNumber}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {onOpenHistory && (
                        <button 
                            onClick={onOpenHistory} 
                            className="p-1 px-1.5 text-[10px] text-gray-300 hover:text-white hover:bg-black/40 rounded transition-colors" 
                            title="Архив операций"
                        >
                            АРХИВ
                        </button>
                    )}
                    {isHost && (
                        <button 
                            onClick={() => setShowOptions(!showOptions)} 
                            className={`p-1 px-1.5 text-[10px] rounded transition-colors ${
                                showOptions ? 'text-yellow-300 bg-black/60 font-bold' : 'text-gray-300 hover:text-white hover:bg-black/40'
                            }`} 
                            title="Настройки логистики"
                        >
                            ОПЦИИ
                        </button>
                    )}
                </div>
            </div>

            {/* Logistics Settings Drawer (Host Only) */}
            {isHost && showOptions && (
                <SteamBox title="ДИРЕКТИВЫ ЛОГИСТИКИ" className="text-[11px] mb-1">
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/30">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors border border-white/5">
                            <input 
                                type="checkbox" 
                                checked={roomOptions?.depletePrimary ?? roomOptions?.depleteWeapons ?? true} 
                                onChange={() => RoomActions.updateRoomOption(roomCode, 'depletePrimary', !(roomOptions?.depletePrimary ?? roomOptions?.depleteWeapons ?? true))} 
                                className="accent-yellow-400" 
                            />
                            <span className="text-gray-300 font-medium text-[10px]">Истощать Primary</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors border border-white/5">
                            <input 
                                type="checkbox" 
                                checked={roomOptions?.depleteSecondary ?? roomOptions?.depleteWeapons ?? true} 
                                onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteSecondary', !(roomOptions?.depleteSecondary ?? roomOptions?.depleteWeapons ?? true))} 
                                className="accent-yellow-400" 
                            />
                            <span className="text-gray-300 font-medium text-[10px]">Истощать Secondary</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors border border-white/5">
                            <input 
                                type="checkbox" 
                                checked={roomOptions?.depleteGrenades ?? roomOptions?.depleteWeapons ?? true} 
                                onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteGrenades', !(roomOptions?.depleteGrenades ?? roomOptions?.depleteWeapons ?? true))} 
                                className="accent-yellow-400" 
                            />
                            <span className="text-gray-300 font-medium text-[10px]">Истощать гранаты</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors border border-white/5">
                            <input 
                                type="checkbox" 
                                checked={roomOptions?.depleteArmor ?? true} 
                                onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteArmor', !(roomOptions?.depleteArmor ?? true))} 
                                className="accent-yellow-400" 
                            />
                            <span className="text-gray-300 font-medium text-[10px]">Истощать броню</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors border border-white/5">
                            <input 
                                type="checkbox" 
                                checked={roomOptions?.depleteStratagems ?? true} 
                                onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteStratagems', !(roomOptions?.depleteStratagems ?? true))} 
                                className="accent-yellow-400" 
                            />
                            <span className="text-gray-300 font-medium text-[10px]">Истощать стратагемы</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors border border-white/5">
                            <input 
                                type="checkbox" 
                                checked={roomOptions?.depleteBoosters || false} 
                                onChange={handleToggleDepleteBoosters} 
                                className="accent-yellow-400" 
                            />
                            <span className="text-gray-300 font-medium text-[10px]">Истощать бустеры</span>
                        </label>
                    </div>
                </SteamBox>
            )}

            {/* Squad Roster */}
            <SteamBox title="ЛИЧНЫЙ СОСТАВ ОТРЯДА" className="text-xs">
                <div className="flex flex-col gap-1.5 p-1">
                    {uids.map((pId, idx) => {
                        const p = players[pId];
                        const isMe = pId === uid;
                        const isPlayerHost = roomOptions?.hostId === pId;
                        const pFilled = getFilledCount(pool, pId);
                        const pMax = getMaxPossibleSlots(pool, pId);
                        const pReady = p?.isReady || false;

                        return (
                            <SteamInset 
                                key={pId} 
                                className={`flex justify-between items-center p-2 rounded transition-colors ${
                                    pReady 
                                        ? 'border-l-4 border-l-green-500 bg-green-950/10' 
                                        : 'border-l-4 border-l-amber-500/80 bg-black/20'
                                } ${isMe ? 'bg-yellow-500/5' : ''}`}
                            >
                                {/* Left: Index, Host text & Name */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] font-mono font-bold text-gray-400 bg-black/40 px-1 py-0.5 rounded">
                                        0{idx + 1}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`font-mono text-xs font-bold truncate ${isMe ? 'text-yellow-300' : 'text-white'}`}>
                                            {p?.name || 'Боец'} 
                                            {isPlayerHost && <span className="text-[10px] text-yellow-400 font-normal ml-1">[HOST]</span>}
                                            {isMe && <span className="text-[10px] text-gray-400 font-normal ml-1">(Вы)</span>}
                                        </span>
                                        <span className="text-[9px] font-mono text-gray-400">
                                            Слоты: {pFilled} / {pMax}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Readiness Badge & Host Controls */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Ready Status Badge */}
                                    {pReady ? (
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-green-900/60 text-green-400 border border-green-500/40">
                                            ГОТОВ
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-500/30">
                                            ВЫБОР...
                                        </span>
                                    )}

                                    {/* Host Controls */}
                                    {isHost && (
                                        <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-1.5">
                                            <button 
                                                onClick={() => handleForceReady(pId)} 
                                                className="text-[10px] font-mono font-bold text-gray-400 hover:text-yellow-300 px-1 py-0.5 rounded hover:bg-black/40 transition-colors"
                                                title={pReady ? "Снять готовность" : "Принудительно подтвердить"}
                                            >
                                                [ГОТОВ]
                                            </button>
                                            {pId !== uid && (
                                                <button 
                                                    onClick={() => handleKickPlayer(pId)} 
                                                    className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 px-1 py-0.5 rounded hover:bg-red-950/40 transition-colors"
                                                    title="Исключить из отряда"
                                                >
                                                    [КИК]
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </SteamInset>
                        );
                    })}
                </div>

                {/* Readiness Progress Bar Footer */}
                <div className="mt-2 pt-2 border-t border-[var(--steam-border-dark)] px-1">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold mb-1">
                        <span className="text-gray-400">Готовность отряда:</span>
                        <span className={allReady ? "text-green-400 font-mono" : "text-amber-400 font-mono"}>
                            {readyCount} / {uids.length} ({readyPercent}%)
                        </span>
                    </div>
                    <div className="w-full bg-black/60 h-2 rounded overflow-hidden border border-[var(--steam-border-dark)]">
                        <div 
                            className={`h-full transition-all duration-300 ${allReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500'}`}
                            style={{ width: `${readyPercent}%` }}
                        />
                    </div>
                </div>
            </SteamBox>

            {/* Tactical Action Area */}
            <div className="mt-1">
                {!isHost ? (
                    <SteamButton 
                        onClick={toggleReady} 
                        disabled={!myPlayer?.isReady && !isLoadoutComplete}
                        className={`w-full py-2.5 text-xs tracking-wider font-bold uppercase transition-all flex items-center justify-center ${
                            myPlayer?.isReady 
                                ? 'bg-green-950/80 text-green-300 border-green-500/60 hover:bg-red-950/80 hover:text-red-300 hover:border-red-500/60' 
                                : isLoadoutComplete 
                                    ? 'bg-yellow-500 text-black font-black hover:bg-yellow-400 shadow-md' 
                                    : 'opacity-60 cursor-not-allowed'
                        }`}
                    >
                        {myPlayer?.isReady 
                            ? 'ГОТОВНОСТЬ ПОДТВЕРЖДЕНА (ОТМЕНИТЬ)' 
                            : !isLoadoutComplete 
                                ? `ВЫБЕРИТЕ СНАРЯЖЕНИЕ (${filled}/${maxSlots})` 
                                : 'ПОДТВЕРДИТЬ ГОТОВНОСТЬ'}
                    </SteamButton>
                ) : (
                    <SteamButton 
                        onClick={handleDeployClick} 
                        disabled={!allReady}
                        className={`w-full py-3 text-xs tracking-widest font-black uppercase transition-all flex items-center justify-center ${
                            allReady 
                                ? 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.4)] cursor-pointer' 
                                : 'opacity-50 cursor-not-allowed text-gray-400 bg-black/40'
                        }`}
                    >
                        {allReady 
                            ? 'ЗАПУСТИТЬ КАПСУЛЫ (DEPLOY)' 
                            : `ОЖИДАНИЕ ГОТОВНОСТИ ОТРЯДА (${readyCount}/${uids.length})`}
                    </SteamButton>
                )}
            </div>
        </SteamWindow>
    );
}
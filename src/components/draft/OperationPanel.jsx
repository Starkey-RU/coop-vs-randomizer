import React, { useState } from 'react';
import { History, Settings, Crown, UserCheck, Skull, CheckCircle, Shield } from 'lucide-react';
import useGameStore from '../../store/useGameStore';
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

    // Phase 2: Moved DB updating to RoomActions
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
        if (window.confirm('Kick player and return their items to the pool?')) {
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
        maxSlots = getMaxPossibleSlots(pool);
    }

    return (
        <SteamWindow className="flex flex-col gap-3 relative shrink-0">
            {/* Header / Meta */}
            <div className="flex justify-between items-center px-2 py-1 steam-group-box-title bg-hcDark/80">
                <span className="font-bold text-hcMuted uppercase tracking-widest text-xs flex items-center gap-2">
                    <Skull size={14} className="text-hcRed"/> ОПЕРАЦИЯ (Миссия #{missionNumber})
                </span>
                <div className="flex items-center gap-1.5">
                    {onOpenHistory && (
                        <button onClick={onOpenHistory} className="p-1.5 text-hcMuted hover:text-white hover:bg-hcDark rounded transition-colors" title="Архив">
                            <History size={14} />
                        </button>
                    )}
                    {isHost && (
                        <button onClick={() => setShowOptions(!showOptions)} className={`p-1.5 rounded transition-colors ${showOptions ? 'text-hcYellow bg-hcDark' : 'text-hcMuted hover:text-white'}`} title="Настройки">
                            <Settings size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Config & Options */}
            {isHost && showOptions && (
                <SteamBox title="НАСТРОЙКИ ЛОГИСТИКИ" className="text-[10px] mx-2">
                    <div className="grid grid-cols-2 gap-1 px-1">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-hcDark p-1.5 rounded transition-colors bg-black/20 border border-hcBorder/20">
                            <input type="checkbox" checked={roomOptions?.depleteBoosters || false} onChange={handleToggleDepleteBoosters} className="accent-hcYellow" />
                            <span className="text-hcMuted tracking-wider font-bold">ИСТОЩАТЬ БУСТЕРЫ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-hcDark p-1.5 rounded transition-colors bg-black/20 border border-hcBorder/20">
                            <input type="checkbox" checked={roomOptions?.depleteWeapons ?? true} onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteWeapons', !(roomOptions?.depleteWeapons ?? true))} className="accent-hcYellow" />
                            <span className="text-hcMuted tracking-wider font-bold">ИСТОЩАТЬ ОРУЖИЕ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-hcDark p-1.5 rounded transition-colors bg-black/20 border border-hcBorder/20">
                            <input type="checkbox" checked={roomOptions?.depleteArmor ?? true} onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteArmor', !(roomOptions?.depleteArmor ?? true))} className="accent-hcYellow" />
                            <span className="text-hcMuted tracking-wider font-bold">ИСТОЩАТЬ БРОНЮ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-hcDark p-1.5 rounded transition-colors bg-black/20 border border-hcBorder/20">
                            <input type="checkbox" checked={roomOptions?.depleteStratagems ?? true} onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteStratagems', !(roomOptions?.depleteStratagems ?? true))} className="accent-hcYellow" />
                            <span className="text-hcMuted tracking-wider font-bold">ЛИМИТ СТРАТАГЕМ</span>
                        </label>
                    </div>
                </SteamBox>
            )}

            {/* Squad Roster */}
            <SteamBox title="ЛИЧНЫЙ СОСТАВ" className="mx-2 mb-2 pb-1 text-xs">
                <div className="flex flex-col gap-1">
                    {uids.map(pId => (
                        <SteamInset key={pId} className="flex justify-between items-center p-1 px-2 border-l-2" style={{ borderLeftColor: players[pId]?.isReady ? '#4ade80' : '#ef4444' }}>
                            <div className="flex items-center gap-2">
                                {roomOptions?.hostId === pId ? <Crown size={12} className="text-hcYellow" /> : <div className="w-3" />}
                                <span className="font-mono text-white truncate max-w-[120px]">{players[pId]?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isHost && pId !== uid && (
                                    <button onClick={() => handleKickPlayer(pId)} className="text-[9px] text-hcRed hover:text-white uppercase font-bold tracking-widest px-1">Кик</button>
                                )}
                                {isHost && (
                                    <button onClick={() => handleForceReady(pId)} className="text-hcMuted hover:text-white"><UserCheck size={14}/></button>
                                )}
                                {players[pId]?.isReady ? <CheckCircle size={14} className="text-hcGreen" /> : <Shield size={14} className="text-hcMuted" />}
                            </div>
                        </SteamInset>
                    ))}
                </div>
                <div className="mt-2 text-right text-[10px] uppercase font-bold text-hcMuted">
                    ГОТОВНОСТЬ: <span className={allReady ? "text-hcGreen" : "text-hcRed"}>{readyCount} / {uids.length}</span>
                </div>
            </SteamBox>

            {/* Action Area */}
            <div className="mt-auto pt-2 mx-2 mb-2">
                {!isHost ? (
                    <SteamButton className="w-full justify-center flex py-3 text-xs tracking-widest font-bold" onClick={toggleReady} disabled={!myPlayer?.isReady && filled < maxSlots}>
                        {myPlayer?.isReady ? 'ОТМЕНИТЬ ГОТОВНОСТЬ' : (filled < maxSlots ? `ВЫБЕРИТЕ СНАРЯЖЕНИЕ (${filled}/${maxSlots})` : 'ПОДТВЕРДИТЬ ЛОДАУТ')}
                    </SteamButton>
                ) : (
                    <SteamButton className="w-full justify-center flex py-3 text-xs tracking-widest font-bold border-hcYellow text-hcYellow hover:bg-hcYellow hover:text-black" onClick={handleDeployClick} disabled={!allReady}>
                        {allReady ? 'ЗАПУСТИТЬ КАПСУЛЫ (DEPLOY)' : 'ОЖИДАНИЕ ХЕЛЛДАЙВЕРОВ'}
                    </SteamButton>
                )}
            </div>
        </SteamWindow>
    );
}
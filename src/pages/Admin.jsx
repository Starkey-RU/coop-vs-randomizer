import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { ref, onValue, remove, update } from 'firebase/database';
import { Shield, Trash2, RefreshCcw, ArrowLeft, Users, Clock, AlertTriangle } from 'lucide-react';

export default function Admin() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const roomsRef = ref(db, 'rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([code, room]) => ({
                    code,
                    ...room
                }));
                list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setRooms(list);
            } else {
                setRooms([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDeleteRoom = async (code) => {
        if (window.confirm(`Удалить комнату ${code}?`)) {
            await remove(ref(db, `rooms/${code}`));
        }
    };

    const handleClearAll = async () => {
        if (window.confirm('ВНИМАНИЕ! Вы уверены, что хотите полностью удалить ВСЕ комнаты из базы?')) {
            await remove(ref(db, 'rooms'));
        }
    };

    const handleRunGC = async () => {
        const now = Date.now();
        const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
        const updates = {};
        let count = 0;

        rooms.forEach(room => {
            if (room.createdAt && (now - room.createdAt > FIVE_DAYS_MS)) {
                updates[`rooms/${room.code}`] = null;
                count++;
            }
        });

        if (count > 0) {
            await update(ref(db), updates);
            alert(`Очистка завершена: удалено ${count} устаревших комнат.`);
        } else {
            alert('Устаревших комнат (>5 дней) не обнаружено.');
        }
    };

    const totalRooms = rooms.length;
    const totalPlayers = rooms.reduce((sum, r) => sum + Object.keys(r.players || {}).length, 0);

    return (
        <div className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto flex flex-col gap-6">
            {/* Top Header */}
            <div className="theme-panel p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => navigate('/')} 
                        className="theme-button p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:text-hcAccent transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-widest text-hcText flex items-center gap-2">
                            <Shield className="text-hcAccent" size={22} /> Панель Администратора
                        </h1>
                        <p className="text-xs text-hcMuted">Мониторинг и управление активными комнатами в Firebase</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                    <button 
                        onClick={handleRunGC}
                        className="theme-button px-3 py-2 min-h-[44px] text-xs font-bold uppercase rounded flex items-center gap-1.5 text-hcAccent hover:bg-hcAccent/10 flex-1 sm:flex-none justify-center"
                        title="Удалить комнаты старше 5 дней"
                    >
                        <RefreshCcw size={14} /> Очистить
                    </button>
                    <button 
                        onClick={handleClearAll}
                        className="theme-button px-3 py-2 min-h-[44px] text-xs font-bold uppercase rounded flex items-center gap-1.5 !text-hcRed border-hcRed hover:bg-hcRed/10 flex-1 sm:flex-none justify-center"
                        title="Удалить абсолютно все комнаты"
                    >
                        <Trash2 size={14} /> Сбросить
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="theme-inner-panel p-4 rounded flex items-center gap-4">
                    <div className="p-3 bg-hcAccent/10 text-hcAccent rounded border border-hcAccent/20">
                        <Shield size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] text-hcMuted uppercase tracking-widest block">Всего комнат</span>
                        <span className="text-2xl font-black font-mono text-hcText">{totalRooms}</span>
                    </div>
                </div>

                <div className="theme-inner-panel p-4 rounded flex items-center gap-4">
                    <div className="p-3 bg-hcBlue/10 text-hcBlue rounded border border-hcBlue/20">
                        <Users size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] text-hcMuted uppercase tracking-widest block">Бойцов в лобби</span>
                        <span className="text-2xl font-black font-mono text-hcText">{totalPlayers}</span>
                    </div>
                </div>

                <div className="theme-inner-panel p-4 rounded flex items-center gap-4">
                    <div className="p-3 bg-hcGreen/10 text-hcGreen rounded border border-hcGreen/20">
                        <Clock size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] text-hcMuted uppercase tracking-widest block">Статус БД</span>
                        <span className="text-sm font-bold text-hcGreen uppercase">Синхронизировано</span>
                    </div>
                </div>
            </div>

            {/* Rooms Table */}
            <div className="theme-panel p-4 rounded-lg flex flex-col gap-4 shadow-lg flex-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-hcMuted border-b border-hcBorder pb-2">
                    Активные лобби в реальном времени ({rooms.length})
                </h2>

                {loading ? (
                    <div className="py-12 text-center text-hcMuted font-mono text-xs uppercase animate-pulse">
                        Загрузка списков базы данных...
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="py-12 text-center text-hcMuted flex flex-col items-center gap-2">
                        <AlertTriangle size={32} className="opacity-40" />
                        <span className="text-xs uppercase font-bold tracking-widest">Активных лобби не обнаружено</span>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse text-hcText">
                                <thead>
                                    <tr className="border-b border-hcBorder text-hcMuted uppercase text-[10px] tracking-wider">
                                        <th className="p-3">Код</th>
                                        <th className="p-3">Режим</th>
                                        <th className="p-3">Хост</th>
                                        <th className="p-3">Игроки</th>
                                        <th className="p-3">Создана</th>
                                        <th className="p-3 text-right">Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rooms.map((room) => {
                                        const playerCount = Object.keys(room.players || {}).length;
                                        const hostName = room.players?.[room.host]?.name || 'Неизвестен';
                                        const createdDate = room.createdAt 
                                            ? new Date(room.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
                                            : 'Нет даты';

                                        return (
                                            <tr key={room.code} className="border-b border-hcBorder/40 hover:bg-hcPanel/50 transition-colors">
                                                <td className="p-3 font-mono font-bold text-hcAccent">{room.code}</td>
                                                <td className="p-3 uppercase font-semibold text-hcBlue">
                                                    {room.mode?.replace('_', ' ')}
                                                </td>
                                                <td className="p-3 font-bold text-hcText">{hostName}</td>
                                                <td className="p-3 font-mono">{playerCount} / 4</td>
                                                <td className="p-3 text-hcMuted font-mono">{createdDate}</td>
                                                <td className="p-3 text-right">
                                                    <button 
                                                        onClick={() => handleDeleteRoom(room.code)}
                                                        className="theme-button p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded !text-hcRed border-hcRed/40 hover:!bg-hcRed hover:!text-white transition-colors ml-auto"
                                                        title="Удалить комнату"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="md:hidden flex flex-col gap-3">
                            {rooms.map((room) => {
                                const playerCount = Object.keys(room.players || {}).length;
                                const hostName = room.players?.[room.host]?.name || 'Неизвестен';
                                const createdDate = room.createdAt 
                                    ? new Date(room.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
                                    : 'Нет даты';

                                return (
                                    <div key={room.code} className="bg-hcDark border border-hcBorder p-3 rounded-lg flex flex-col gap-2 relative">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-hcAccent text-lg leading-none">{room.code}</span>
                                                <span className="uppercase font-semibold text-hcBlue text-xs mt-1">{room.mode?.replace('_', ' ')}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteRoom(room.code)}
                                                className="theme-button p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded !text-hcRed border-hcRed/40 hover:!bg-hcRed hover:!text-white transition-colors"
                                                title="Удалить комнату"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-hcBorder/50 text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-hcMuted uppercase tracking-widest">Хост</span>
                                                <span className="font-bold text-hcText truncate">{hostName}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-hcMuted uppercase tracking-widest">Игроки</span>
                                                <span className="font-mono">{playerCount} / 4</span>
                                            </div>
                                            <div className="flex flex-col col-span-2">
                                                <span className="text-[10px] text-hcMuted uppercase tracking-widest">Создана</span>
                                                <span className="text-hcMuted font-mono">{createdDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
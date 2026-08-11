import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import { Skull, Moon, Sun, ArrowRight, ShieldAlert, Settings } from 'lucide-react';
import WarbondSettings from '../components/settings/WarbondSettings';

const Home = () => {
    const navigate = useNavigate();
    const { name, setName, createRoom, joinRoom, listenToActiveRooms, activeRooms } = useGameStore();

    const [mode, setMode] = useState('attrition'); 
    const [isDark, setIsDark] = useState(document.body.getAttribute('data-dark') === 'true');
    const [showWarbonds, setShowWarbonds] = useState(false);

    const [forceRender, setForceRender] = useState(0);

    useEffect(() => {
        listenToActiveRooms();
    }, []);

    const toggleTheme = (theme) => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('bingo_theme', theme);
        setForceRender(prev => prev + 1);
    };

    const toggleDarkMode = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) document.body.setAttribute('data-dark', 'true');
        else document.body.setAttribute('data-dark', 'false');
        localStorage.setItem('bingo_dark_mode', next.toString());
        setForceRender(prev => prev + 1);
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        try {
            const newCode = await createRoom(mode);
            if (newCode) {
                navigate(`/room/${newCode}`);
            }
        } catch (error) {
            console.error(error);
            alert("Ошибка при создании комнаты: " + error.message + "\nПроверьте правила Firebase!");
        }
    };

    const handleJoin = async (code) => {
        if (!name.trim()) return;
        try {
            await joinRoom(code);
            navigate(`/room/${code.toUpperCase()}`);
        } catch (err) {
            alert("Комната не найдена или ошибка подключения.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 overflow-x-hidden w-full box-border">
            <div className="theme-panel w-full max-w-2xl p-3 sm:p-5 flex flex-col gap-4 sm:gap-5 shadow-xl rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 border-hcBorder gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider">
                        Attrition <span className="theme-highlight text-hcAccent">Protocol</span>
                    </h1>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => navigate('/admin')}
                            className="theme-button p-2 min-h-[44px] min-w-[44px] flex-1 sm:flex-none flex items-center justify-center rounded hover:text-hcAccent transition-colors"
                            title="Панель администратора"
                        >
                            <ShieldAlert size={20} />
                        </button>
                        <button 
                            onClick={() => setShowWarbonds(!showWarbonds)}
                            className={`theme-button p-2 min-h-[44px] min-w-[44px] flex-1 sm:flex-none flex items-center justify-center rounded ${showWarbonds ? 'active bg-hcBorder' : ''}`}
                            title="Лицензии (Warbonds)"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {showWarbonds ? (
                    <WarbondSettings onClose={() => setShowWarbonds(false)} />
                ) : (
                    <div className="flex flex-col gap-4 sm:gap-5">
                        {/* Nickname Input */}
                        <div className="theme-inner-panel flex flex-col items-center gap-2 p-3 rounded w-full box-border">
                            <label className="text-xs sm:text-sm font-bold text-hcMuted uppercase tracking-widest">Позывной</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="theme-input px-3 py-2 min-h-[44px] font-bold text-center w-full outline-none rounded box-border"
                                placeholder="Например: John Helldiver"
                            />
                        </div>

                        {/* Create Room Block */}
                        <div className="theme-inner-panel flex flex-col gap-3 p-3 sm:p-4 rounded w-full box-border">
                            <h3 className="font-bold text-xs text-hcMuted uppercase border-b border-hcBorder pb-1">Новая операция</h3>
                            
                            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2 mb-1 w-full">
                                <button onClick={() => setMode('chaos_random')} className={`theme-button px-3 min-h-[44px] text-xs sm:text-sm font-bold rounded flex-1 ${mode === 'chaos_random' ? 'active theme-highlight' : ''}`} title="Случайно выдает каждому игроку случайный лодаут. Предметы не кончаются.">Chaos Random</button>
                                <button onClick={() => setMode('chaos_attrition')} className={`theme-button px-3 min-h-[44px] text-xs sm:text-sm font-bold rounded flex-1 ${mode === 'chaos_attrition' ? 'active theme-highlight' : ''}`} title="Случайно выдает каждому игроку случайный лодаут, предметы не повторяются.">Chaos Attrition</button>
                                <button onClick={() => setMode('attrition')} className={`theme-button px-3 min-h-[44px] text-xs sm:text-sm font-bold rounded flex-1 ${mode === 'attrition' ? 'active theme-highlight' : ''}`} title="Ручной выбор предметов пула из общего пула. Выбирайте аккуратно.">Attrition</button>
                                <button onClick={() => setMode('random_pool')} className={`theme-button px-3 min-h-[44px] text-xs sm:text-sm font-bold rounded flex-1 ${mode === 'random_pool' ? 'active theme-highlight' : ''}`} title="Случайно выбранный пул предметов-допуска (на 4 человека) на всю операцию.">Random Pool</button>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={!name.trim()}
                                className="theme-button px-4 min-h-[44px] font-bold text-sm transition-colors rounded disabled:opacity-50 theme-highlight w-full mt-2 box-border"
                            >
                                Создать Лобби Операции
                            </button>
                        </div>

                        {/* Active Rooms List */}
                        <div className="theme-inner-panel flex flex-col gap-2 p-3 sm:p-4 rounded w-full box-border">
                            <h3 className="font-bold text-xs text-hcMuted uppercase border-b border-hcBorder pb-1">Открытые операции ({activeRooms.length})</h3>
                            {activeRooms.length === 0 ? (
                                <div className="text-hcMuted text-xs italic py-6 text-center flex flex-col items-center justify-center gap-2">
                                    <ShieldAlert size={24} className="opacity-50" />
                                    <span>Сигналы SOS не обнаружены.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-[300px] sm:max-h-[220px] overflow-y-auto pr-1 custom-scrollbar w-full">
                                    {activeRooms.map((room) => (
                                        <div 
                                            key={room.id} 
                                            className="theme-button flex justify-between items-center p-3 min-h-[44px] text-xs transition-colors rounded cursor-pointer gap-2 w-full box-border" 
                                            onClick={() => handleJoin(room.id)}
                                        >
                                            <div className="flex flex-col text-left break-all overflow-hidden">
                                                <span className="font-bold text-white text-sm truncate">Лобби {room.players[room.host]?.name}</span>
                                                <span className="text-[11px] theme-highlight mt-1 truncate">Режим: {room.mode.replace('_', ' ')} | ID: {room.id} | Игроки: {Object.keys(room.players || {}).length}/4</span>
                                            </div>
                                            <ArrowRight size={20} className="theme-highlight shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Theme Toggles */}
                <div className="pt-3 border-t flex flex-col gap-3 items-center border-hcBorder mt-2 w-full box-border">
                    <span className="text-[10px] font-bold text-hcMuted uppercase">Настройки интерфейса</span>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-center gap-2 box-border">
                        <button onClick={() => toggleTheme('plain')} className={`theme-button min-h-[44px] text-xs sm:text-[10px] py-2 px-3 rounded uppercase flex-1 ${document.body.getAttribute('data-theme') === 'plain' ? 'active' : ''}`}>Plain CSS</button>
                        <button onClick={() => toggleTheme('steam2003')} className={`theme-button min-h-[44px] text-xs sm:text-[10px] py-2 px-3 rounded uppercase flex-1 ${document.body.getAttribute('data-theme') === 'steam2003' ? 'active' : ''}`}>Steam 2003</button>
                        <button onClick={toggleDarkMode} className={`theme-button min-h-[44px] text-xs sm:text-[10px] py-2 px-3 rounded uppercase flex items-center justify-center gap-2 flex-1 ${isDark ? 'active' : ''}`}>
                            {isDark ? <Sun size={14} /> : <Moon size={14} />} Dark Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
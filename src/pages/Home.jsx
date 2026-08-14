import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import WarbondSettings from '../components/settings/WarbondSettings';
import SteamWindow from '../components/ui/SteamWindow';
import SteamInset from '../components/ui/SteamInset';
import SteamButton from '../components/ui/SteamButton';

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
        <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 overflow-x-hidden w-full box-border font-mono">
            <SteamWindow className="w-full max-w-2xl p-3 sm:p-4 flex flex-col gap-3">
                
                {/* Header */}
                <div className="steam-dialog-header flex justify-between items-center text-xs">
                    <span className="font-bold">HELLDIVERS II // ATTRITION PROTOCOL & LOADOUT DRAFT</span>
                    <div className="flex items-center gap-1">
                        <SteamButton 
                            variant="tab"
                            onClick={() => navigate('/admin')}
                            className="px-2 py-0.5 text-[10px] font-bold"
                            title="Панель администратора"
                        >
                            [ АДМИН ]
                        </SteamButton>
                        <SteamButton 
                            variant={showWarbonds ? 'primary' : 'tab'}
                            onClick={() => setShowWarbonds(!showWarbonds)}
                            className="px-2 py-0.5 text-[10px] font-bold"
                            title="Лицензии (Warbonds)"
                        >
                            {showWarbonds ? '[ ЗАКРЫТЬ ]' : '[ ЛИЦЕНЗИИ / WARBONDS ]'}
                        </SteamButton>
                    </div>
                </div>

                {showWarbonds ? (
                    <WarbondSettings onClose={() => setShowWarbonds(false)} />
                ) : (
                    <div className="flex flex-col gap-3">
                        
                        {/* Nickname Input */}
                        <SteamInset className="p-3 flex flex-col items-center gap-1.5 w-full">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                ПОЗЫВНОЙ ОПЕРАТИВНИКА:
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-black/60 border border-[var(--steam-border-dark)] px-3 py-1.5 text-xs font-mono font-bold text-center w-full outline-none text-hcAccent focus:border-hcAccent"
                                placeholder="Например: John Helldiver"
                            />
                        </SteamInset>

                        {/* Create Room Block */}
                        <SteamInset className="p-3 flex flex-col gap-2.5 w-full">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-[var(--steam-border-dark)] pb-1">
                                [ НОВАЯ ОПЕРАЦИЯ ]
                            </span>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
                                {[
                                    { id: 'chaos_random', label: 'Chaos Random' },
                                    { id: 'chaos_attrition', label: 'Chaos Attrition' },
                                    { id: 'attrition', label: 'Co-op Draft' },
                                    { id: 'random_pool', label: 'Random Pool' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`steam-tab-btn text-center text-[10px] font-mono font-bold uppercase py-2 transition-colors ${
                                            mode === m.id ? 'active text-hcAccent' : 'text-slate-400'
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            <SteamButton
                                variant="primary"
                                onClick={handleCreate}
                                disabled={!name.trim()}
                                className="w-full py-2.5 text-xs font-bold font-mono uppercase tracking-wider mt-1 disabled:opacity-40"
                            >
                                [ СОЗДАТЬ ЛОББИ ОПЕРАЦИИ ]
                            </SteamButton>
                        </SteamInset>

                        {/* Active Rooms List */}
                        <SteamInset className="p-3 flex flex-col gap-2 w-full">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-[var(--steam-border-dark)] pb-1">
                                [ ОТКРЫТЫЕ ОПЕРАЦИИ: {activeRooms.length} ]
                            </span>
                            
                            {activeRooms.length === 0 ? (
                                <div className="text-slate-500 text-xs italic py-4 text-center">
                                    [ Сигналы SOS не обнаружены ]
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar w-full">
                                    {activeRooms.map((room) => (
                                        <div 
                                            key={room.id} 
                                            className="flex justify-between items-center p-2 text-xs bg-black/40 border border-[var(--steam-border-dark)] hover:border-hcAccent/50 cursor-pointer transition-colors" 
                                            onClick={() => handleJoin(room.id)}
                                        >
                                            <div className="flex flex-col text-left overflow-hidden">
                                                <span className="font-bold text-slate-200 text-xs truncate">Лобби {room.players[room.host]?.name}</span>
                                                <span className="text-[10px] text-hcAccent mt-0.5 truncate">
                                                    Режим: {room.mode.replace('_', ' ').toUpperCase()} | ID: {room.id} | Бойцы: {Object.keys(room.players || {}).length}/4
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-hcAccent font-bold px-2 py-1 bg-black border border-[var(--steam-border-dark)]">
                                                [ ВОЙТИ → ]
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SteamInset>
                    </div>
                )}

                {/* Theme Toggles */}
                <div className="pt-2 border-t border-[var(--steam-border-dark)] flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
                    <span className="text-[10px] font-bold uppercase">[ НАСТРОЙКИ ТЕМЫ ]</span>
                    <div className="flex items-center gap-1">
                        <SteamButton onClick={() => toggleTheme('plain')} className={`px-2 py-0.5 text-[9px] font-bold uppercase ${document.body.getAttribute('data-theme') === 'plain' ? 'active' : ''}`}>[ Plain ]</SteamButton>
                        <SteamButton onClick={() => toggleTheme('steam2003')} className={`px-2 py-0.5 text-[9px] font-bold uppercase ${document.body.getAttribute('data-theme') === 'steam2003' ? 'active' : ''}`}>[ Steam 2003 ]</SteamButton>
                        <SteamButton onClick={toggleDarkMode} className={`px-2 py-0.5 text-[9px] font-bold uppercase ${isDark ? 'active' : ''}`}>
                            {isDark ? '[ Темная: ON ]' : '[ Темная: OFF ]'}
                        </SteamButton>
                    </div>
                </div>
            </SteamWindow>
        </div>
    );
};

export default Home;
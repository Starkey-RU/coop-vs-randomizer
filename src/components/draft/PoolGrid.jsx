import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../../store/useGameStore';
import { useDraft } from '../../hooks/useDraft';
import { ShieldAlert, Crosshair, Zap, Skull, Shield, Activity, Package, ShoppingBag, AlertTriangle, Lock } from 'lucide-react';
import ArmorDisplay from '../ui/ArmorDisplay';
import { getDefaultWarbonds } from '../../utils/warbondRegistry';

const getMyOwnedWarbonds = () => {
    try {
        const saved = localStorage.getItem('bingo_owned_warbonds');
        return saved ? JSON.parse(saved) : getDefaultWarbonds();
    } catch (e) {
        return getDefaultWarbonds();
    }
};

const icons = {
    primary: <Crosshair size={14} />,
    secondary: <Zap size={14} />,
    grenade: <Skull size={14} />,
    armor: <Shield size={14} />,
    booster: <Activity size={14} />,
    stratagems: <Package size={14} />
};

const getGridCols = (cat) => {
    if (cat === 'primary' || cat === 'secondary' || cat === 'grenade') {
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3';
    }
    if (cat === 'booster') {
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5';
    }
    if (cat === 'stratagems') {
        return 'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2';
    }
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5';
};

const groupItemsBySubcategory = (itemList, cat) => {
    if (cat === 'primary' || cat === 'secondary') {
        const groups = {
            'Submachine Guns & Pistols': [],
            'Assault Rifles & Marksman': [],
            'Shotguns': [],
            'Energy & Plasma': [],
            'Explosive & Special': [],
            'Other': []
        };

        itemList.forEach(item => {
            const tags = item.tags || [];
            const tagLower = tags.map(t => typeof t === 'string' ? t.toLowerCase() : '');
            
            if (tagLower.some(t => ['submachinegun', 'smg', 'pistol', 'sidearm', 'onehanded'].includes(t)) || ['smg37defender', 'mp98knight', 'smg72pummeler', 'smg32reprimand', 'sta11smg', 'm7s'].includes(item.id)) {
                groups['Submachine Guns & Pistols'].push(item);
            } else if (tagLower.some(t => ['assaultrifle', 'sniper', 'marksmanrifle'].includes(t))) {
                groups['Assault Rifles & Marksman'].push(item);
            } else if (tagLower.includes('shotgun')) {
                groups['Shotguns'].push(item);
            } else if (tagLower.some(t => ['energy', 'plasma', 'laser', 'arc'].includes(t))) {
                groups['Energy & Plasma'].push(item);
            } else if (tagLower.includes('explosive') || ['jar5dominator', 'r36eruptor', 'cb9explodingcrossbow'].includes(item.id)) {
                groups['Explosive & Special'].push(item);
            } else {
                groups['Other'].push(item);
            }
        });

        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }

    if (cat === 'stratagems') {
        const groups = {
            'Offensive Stratagems': [],
            'Defensive Stratagems': [],
            'Utility & Supply': []
        };

        itemList.forEach(item => {
            const tags = (item.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : '');
            const slotType = (item.slotType || '').toLowerCase();
            const name = (item.name || '').toLowerCase();

            const isOffensive = slotType === 'orbital' || slotType === 'eagle' || tags.includes('orbital') || tags.includes('eagle') || name.includes('orbital') || name.includes('eagle');
            const isDefensive = ['defensive', 'sentries', 'sentry', 'emplacement'].includes(slotType) || tags.some(t => ['turret', 'sentry', 'emplacement', 'mine'].includes(t)) || name.includes('sentry') || name.includes('emplacement') || name.includes('mine');

            if (isOffensive) {
                groups['Offensive Stratagems'].push(item);
            } else if (isDefensive) {
                groups['Defensive Stratagems'].push(item);
            } else {
                groups['Utility & Supply'].push(item);
            }
        });

        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }

    return [['', itemList]];
};

export default function PoolGrid({ category, poolSection }) {
    const { uid } = useGameStore();
    const { claimItem, unclaimItem } = useDraft();
    const [hasHover, setHasHover] = useState(true);
    const [activeTooltipId, setActiveTooltipId] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const [showDebugNames, setShowDebugNames] = useState(() => localStorage.getItem('hd2_debug_names') === 'true');

    const toggleDebugNames = () => {
        const next = !showDebugNames;
        setShowDebugNames(next);
        localStorage.setItem('hd2_debug_names', next ? 'true' : 'false');
    };

    useEffect(() => {
        setHasHover(window.matchMedia('(hover: hover)').matches);
        
        const handleClickOutside = () => {
            if (!hasHover) setActiveTooltipId(null);
        };
        
        if (!hasHover) {
            document.addEventListener('touchstart', handleClickOutside);
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [hasHover]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    };

    if (!poolSection) return null;

    // Превращаем хэшмап обратно в массив для отрисовки
    const items = Object.values(poolSection);

    // Сортируем: сначала свободные, потом занятые
    items.sort((a, b) => {
        if (a.claimedBy && !b.claimedBy) return 1;
        if (!a.claimedBy && b.claimedBy) return -1;
        return a.name.localeCompare(b.name);
    });

    const handleItemClick = (e, item) => {
        if (!hasHover) {
            e.stopPropagation();
            if (activeTooltipId === item.id) {
                // Если тултип уже открыт - выполняем действие
                performAction(item);
                setActiveTooltipId(null);
            } else {
                // Иначе просто открываем тултип
                setActiveTooltipId(item.id);
            }
        } else {
            performAction(item);
        }
    };
    
    const performAction = async (item) => {
        if (!item.claimedBy) {
            const res = await claimItem(category, item.id);
            if (res && !res.success) {
                if (res.reason === 'EXOSUIT_LIMIT') {
                    showToast("Максимум 1 Экзоскелет на бойца!");
                } else if (res.reason === 'WARBOND_NOT_OWNED') {
                    showToast("У вас нет личной лицензии на этот Warbond!");
                } else if (res.reason === 'SLOT_LIMIT') {
                    showToast("Максимум 4 стратагемы в билде!");
                }
            }
        } else if (item.claimedBy === uid) {
            unclaimItem(category, item.id);
        }
    };

    return (
        <div className="bg-hcDark border border-hcBorder p-3 sm:p-4 rounded-lg relative">
            {toastMessage && (
                <div className="absolute top-2 right-2 z-[100] bg-red-950/90 border border-red-500 text-red-200 px-3 py-2 rounded shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 text-xs sm:text-sm font-bold uppercase tracking-wider">
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            <h3 className="flex items-center justify-between text-hcMuted font-bold uppercase tracking-widest text-sm sm:text-base border-b border-hcBorder pb-2 mb-3 sm:mb-4">
                <span className="flex items-center gap-2">
                    {icons[category]} {category}
                </span>
                <button
                    onClick={toggleDebugNames}
                    className={`theme-button px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${showDebugNames ? 'active theme-highlight text-hcGreen' : 'text-gray-400 opacity-70 hover:opacity-100'}`}
                    title="Переключить отображение технических имен и файлов для отладки"
                >
                    Dev Names {showDebugNames ? 'ON' : 'OFF'}
                </button>
            </h3>
            
            {category === 'armor' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {items.map(item => {
                        const isMine = item.claimedBy === uid;
                        const isTaken = item.claimedBy && !isMine;
                        const showTooltip = !hasHover && activeTooltipId === item.id;
                        
                        const myWarbonds = getMyOwnedWarbonds();
                        const code = item.warbondCode || item.code;
                        const isFree = !code || code === 'none' || item.isBase;
                        const isLocked = !isFree && !isTaken && !myWarbonds.includes(code) && !myWarbonds.includes(item.id);

                        let borderClass = 'border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] cursor-pointer';
                        let opacityClass = 'opacity-100';

                        if (isMine) {
                            borderClass = 'border-hcAccent bg-hcAccent/10 shadow-[0_0_10px_rgba(210,185,54,0.2)]';
                        } else if (isTaken) {
                            borderClass = 'border-red-900/60 bg-red-900/10 cursor-not-allowed';
                            opacityClass = 'opacity-40 grayscale';
                        } else if (isLocked) {
                            borderClass = 'border-red-900/40 bg-black/40 cursor-not-allowed';
                            opacityClass = 'opacity-60';
                        }

                        return (
                            <div
                                key={item.id}
                                onClick={(e) => handleItemClick(e, item)}
                                className={`relative h-44 sm:h-48 rounded flex flex-col justify-between transition-all group overflow-visible steam-inset-box bg-hcPanel ${borderClass} ${opacityClass}`}
                            >
                                <div className="flex-1 w-full relative min-h-0 bg-hcDark/30 p-1 flex items-center justify-center overflow-hidden">
                                    {showDebugNames && (
                                        <div className="absolute top-0 left-0 right-0 z-30 bg-yellow-400 text-black font-mono text-[9px] font-bold px-1 py-0.5 text-center truncate border-b border-black shadow">
                                            {item.id} | {code || 'base'}
                                        </div>
                                    )}
                                    <img 
                                        src={`/armor/${item.imageURL}`} 
                                        alt={item.name} 
                                        className="w-full h-full object-contain filter drop-shadow-md z-0 transform scale-[1.05] group-hover:scale-110 transition-transform" 
                                        onError={(e) => { e.target.style.opacity = '0.3'; }}
                                    />
                                    {/* Steam Badges Overlay */}
                                    <div className="absolute top-1 left-1 z-10">
                                        <ArmorDisplay item={item} compact={true} showImage={false} showTooltip={false} />
                                    </div>
                                </div>
                                
                                <div className="shrink-0 px-1 py-1.5 bg-black/60 border-t border-[var(--steam-border-dark)] z-10">
                                    <span className="text-[10px] sm:text-[9px] block text-center text-slate-100 uppercase font-bold leading-tight truncate px-0.5 tracking-wide">
                                        {item.name}
                                    </span>
                                </div>

                                {isTaken && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded z-20 pointer-events-none">
                                        <ShieldAlert className="text-hcRed animate-pulse" size={28} />
                                    </div>
                                )}

                                {isLocked && (
                                    <div 
                                        className="absolute inset-0 rounded z-20 pointer-events-none border border-red-900/60"
                                        style={{
                                            backgroundImage: 'repeating-linear-gradient(45deg, rgba(220,38,38,0.2), rgba(220,38,38,0.2) 10px, rgba(0,0,0,0.75) 10px, rgba(0,0,0,0.75) 20px)'
                                        }}
                                    />
                                )}
                                
                                {/* Mobile Action Overlay for Armor */}
                                {showTooltip && !isTaken && (
                                     <div className="absolute inset-0 z-[60] bg-black/90 rounded flex items-center justify-center p-2 backdrop-blur-sm border border-hcAccent animate-in fade-in zoom-in duration-200">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); performAction(item); setActiveTooltipId(null); }}
                                            className={`min-h-[44px] w-full max-w-[200px] flex items-center justify-center rounded text-white font-bold uppercase tracking-widest text-xs border transition-colors ${
                                                isMine 
                                                    ? 'bg-red-900/90 border-red-500/50 hover:bg-red-800' 
                                                    : 'bg-hcAccent/20 border-hcAccent/50 hover:bg-hcAccent/30 text-hcAccent'
                                            }`}
                                        >
                                            {isMine ? 'Unequip' : 'Equip Armor'}
                                        </button>
                                     </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {groupItemsBySubcategory(items, category).map(([subTitle, subItems], subIdx) => (
                        <div key={subIdx} className="flex flex-col gap-2">
                            {subTitle && (
                                <div className="text-[11px] font-bold text-hcMuted uppercase tracking-wider border-b border-hcBorder/40 pb-1 pt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-hcAccent rounded-full inline-block"></span>
                                    {subTitle}
                                </div>
                            )}
                            <div className={`grid ${getGridCols(category)}`}>
                                {subItems.map(item => {
                                    const isMine = item.claimedBy === uid;
                                    const isTaken = item.claimedBy && !isMine;
                                    const showTooltip = !hasHover && activeTooltipId === item.id;

                                    const myWarbonds = getMyOwnedWarbonds();
                                    const code = item.warbondCode || item.code;
                                    const isFree = !code || code === 'none' || item.isBase;
                                    const isLocked = !isFree && !isTaken && !myWarbonds.includes(code) && !myWarbonds.includes(item.id);
                                    
                                    let borderClass = 'border-gray-700 hover:border-gray-400 cursor-pointer';
                                    let opacityClass = 'opacity-100';

                                    if (isMine) {
                                        borderClass = 'border-hcAccent bg-hcAccent/10';
                                    } else if (isTaken) {
                                        borderClass = 'border-red-900 bg-red-900/10 cursor-not-allowed';
                                        opacityClass = 'opacity-30 grayscale';
                                    } else if (isLocked) {
                                        borderClass = 'border-red-900/80 cursor-not-allowed';
                                        opacityClass = 'opacity-80';
                                    }

                                    const imagePath = category === 'stratagems' 
                                        ? `/assets/stratagems/${item.imageURL}`
                                        : `/assets/images/${item.imageURL}`;

                                    const isSuperstore = item.warbondCode === 'superstore' || item.tags?.includes('Superstore');

                                    return (
                                        <div 
                                            key={item.id}
                                            onClick={(e) => handleItemClick(e, item)}
                                            className={`aspect-square p-2 border rounded flex flex-col items-center justify-center relative group transition-all min-h-[44px] overflow-hidden ${borderClass} ${opacityClass}`}
                                        >
                                            {showDebugNames && (
                                                <div className="absolute top-0 left-0 right-0 z-30 bg-yellow-400 text-black font-mono text-[8px] font-bold px-0.5 py-0.5 text-center truncate border-b border-black leading-none">
                                                    {item.id}
                                                </div>
                                            )}
                                            <img src={imagePath} alt={item.name} className="w-full h-full object-contain filter drop-shadow-md pointer-events-none" onError={(e) => e.target.src = ''} />
                                            
                                            {isSuperstore && (
                                                <div className="absolute bottom-1 right-1 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" title="Superstore">
                                                    <ShoppingBag size={12} className="text-cyan-400" />
                                                </div>
                                            )}

                                            {isTaken && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <ShieldAlert className="text-red-500 drop-shadow-md" size={24} />
                                                </div>
                                            )}

                                            {isLocked && (
                                                <div 
                                                    className="absolute inset-0 rounded z-20 pointer-events-none border border-red-900/60"
                                                    style={{
                                                        backgroundImage: 'repeating-linear-gradient(45deg, rgba(220,38,38,0.25), rgba(220,38,38,0.25) 8px, rgba(0,0,0,0.75) 8px, rgba(0,0,0,0.75) 16px)'
                                                    }}
                                                />
                                            )}

                                            {/* Desktop Hover Tooltip */}
                                            {hasHover && (
                                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black border border-hcBorder text-white text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity shadow-lg">
                                                    <span className={isMine ? 'text-hcAccent font-bold' : ''}>{item.name}</span>
                                                    {isTaken && <span className="text-red-400 ml-1">(TAKEN)</span>}
                                                    {isLocked && <span className="text-red-400 ml-1">(LOCKED - WARBOND REQUIRED)</span>}
                                                </div>
                                            )}
                                            
                                            {/* Mobile Tap Popover */}
                                            {showTooltip && (
                                                <div 
                                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black border border-hcBorder p-3 rounded z-[60] shadow-2xl flex flex-col items-center gap-2 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="text-white text-sm font-bold text-center leading-tight">
                                                        {item.name}
                                                    </div>
                                                    {isTaken ? (
                                                        <div className="text-red-500 text-xs font-bold bg-red-900/20 px-2 py-1 rounded w-full text-center">
                                                            Already Taken
                                                        </div>
                                                    ) : isLocked ? (
                                                        <div className="text-red-400 text-xs font-bold bg-red-950/80 border border-red-500/40 px-2 py-1 rounded w-full text-center">
                                                            Warbond Required
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); performAction(item); setActiveTooltipId(null); }}
                                                            className={`w-full min-h-[44px] rounded text-xs font-bold uppercase tracking-widest transition-colors ${
                                                                isMine 
                                                                    ? 'bg-red-900/80 hover:bg-red-700 text-white border border-red-500/50' 
                                                                    : 'bg-hcAccent/20 hover:bg-hcAccent/40 text-hcAccent border border-hcAccent/50'
                                                            }`}
                                                        >
                                                            {isMine ? 'Unequip' : 'Equip'}
                                                        </button>
                                                    )}
                                                    {/* Little arrow pointing down */}
                                                    <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black border-r border-b border-hcBorder rotate-45"></div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

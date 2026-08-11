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
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3';
    }
    if (cat === 'stratagems') {
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2';
    }
    return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2';
};

const groupItemsBySubcategory = (itemList, cat) => {
    if (cat === 'primary' || cat === 'secondary') {
        const groups = {
            'Assault Rifles & Snipers / Штурмовые и Снайперские': [],
            'Shotguns / Дробовики': [],
            'Energy & Plasma / Энергетическое': [],
            'Pistols, SMGs & Explosives / Пистолеты и ПП': [],
            'Разное / Специальное': []
        };

        itemList.forEach(item => {
            const tags = item.tags || [];
            if (tags.includes('AssaultRifle') || tags.includes('Sniper') || tags.includes('MarksmanRifle')) {
                groups['Assault Rifles & Snipers / Штурмовые и Снайперские'].push(item);
            } else if (tags.includes('Shotgun')) {
                groups['Shotguns / Дробовики'].push(item);
            } else if (tags.includes('Energy')) {
                groups['Energy & Plasma / Энергетическое'].push(item);
            } else if (tags.some(t => ['Pistol', 'Sidearm', 'SMG', 'Explosive'].includes(t))) {
                groups['Pistols, SMGs & Explosives / Пистолеты и ПП'].push(item);
            } else {
                groups['Разное / Специальное'].push(item);
            }
        });

        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }

    if (cat === 'stratagems') {
        const groups = {
            'Orbital Strikes / Орбитальные пушки': [],
            'Eagle Airstrikes / Авиаудары Eagle': [],
            'Defensive & Sentries / Защита и Турели': [],
            'Supply, Backpacks & Vehicles / Снабжение и Техника': []
        };

        itemList.forEach(item => {
            const slotType = item.slotType || '';
            const tags = item.tags || [];
            if (slotType === 'Orbital' || tags.includes('orbital')) {
                groups['Orbital Strikes / Орбитальные пушки'].push(item);
            } else if (slotType === 'Eagle' || tags.includes('eagle')) {
                groups['Eagle Airstrikes / Авиаудары Eagle'].push(item);
            } else if (['Defensive', 'Sentries'].includes(slotType) || tags.some(t => ['turret', 'sentry'].includes(t))) {
                groups['Defensive & Sentries / Защита и Турели'].push(item);
            } else {
                groups['Supply, Backpacks & Vehicles / Снабжение и Техника'].push(item);
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

            <h3 className="flex items-center gap-2 text-hcMuted font-bold uppercase tracking-widest text-sm sm:text-base border-b border-hcBorder pb-2 mb-3 sm:mb-4">
                {icons[category]} {category}
            </h3>
            
            {category === 'armor' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {items.map(item => {
                        const isMine = item.claimedBy === uid;
                        const isTaken = item.claimedBy && !isMine;
                        const showTooltip = !hasHover && activeTooltipId === item.id;
                        
                        const myWarbonds = getMyOwnedWarbonds();
                        const code = item.warbondCode || item.code;
                        const isFree = !code || code === 'none' || item.isBase;
                        const isLocked = !isFree && !isTaken && !myWarbonds.includes(code) && !myWarbonds.includes(item.id);

                        let borderClass = 'border-hcBorder hover:border-hcAccent cursor-pointer';
                        let opacityClass = 'opacity-100';

                        if (isMine) {
                            borderClass = 'border-hcAccent bg-hcAccent/10 shadow-[0_0_10px_rgba(210,185,54,0.2)]';
                        } else if (isTaken) {
                            borderClass = 'border-red-900/60 bg-red-900/10 cursor-not-allowed';
                            opacityClass = 'opacity-40 grayscale';
                        } else if (isLocked) {
                            borderClass = 'border-red-900/80 cursor-not-allowed';
                            opacityClass = 'opacity-80';
                        }

                        return (
                            <div
                                key={item.id}
                                onClick={(e) => handleItemClick(e, item)}
                                className={`relative rounded-lg transition-all p-2 flex items-center gap-3 bg-hcDark/80 h-full border overflow-hidden min-h-[72px] ${borderClass} ${opacityClass}`}
                            >
                                <div className="w-12 h-16 shrink-0 relative flex items-center justify-center bg-black/40 rounded border border-hcBorder/40 p-1">
                                    <img 
                                        src={`/armor/${item.imageURL}`} 
                                        alt={item.name} 
                                        className="max-h-full max-w-full object-contain filter drop-shadow" 
                                        onError={(e) => { e.target.style.opacity = '0.3'; }}
                                    />
                                </div>
                                
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                    <div className="font-bold text-xs text-slate-100 truncate">{item.name}</div>
                                    <ArmorDisplay item={item} compact={true} showImage={false} showTooltip={false} />
                                </div>
                                
                                {isTaken && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg z-20 pointer-events-none">
                                        <ShieldAlert className="text-hcRed animate-pulse" size={28} />
                                    </div>
                                )}

                                {isLocked && (
                                    <div 
                                        className="absolute inset-0 rounded-lg z-20 pointer-events-none border border-red-900/60"
                                        style={{
                                            backgroundImage: 'repeating-linear-gradient(45deg, rgba(220,38,38,0.2), rgba(220,38,38,0.2) 10px, rgba(0,0,0,0.75) 10px, rgba(0,0,0,0.75) 20px)'
                                        }}
                                    />
                                )}
                                
                                {/* Mobile Action Overlay for Armor */}
                                {showTooltip && !isTaken && (
                                     <div className="absolute inset-0 z-[60] bg-black/90 rounded-lg flex items-center justify-center p-2 backdrop-blur-sm border border-hcAccent animate-in fade-in zoom-in duration-200">
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

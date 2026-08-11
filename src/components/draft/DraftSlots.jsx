import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../../store/useGameStore';
import ArmorDisplay from '../ui/ArmorDisplay';
import { ref, update } from 'firebase/database';
import { db } from '../../utils/firebase';

export default function DraftSlots({ build, isMe, playerName, isReady, onSelectCategory }) {
    const { roomCode, roomData, uid } = useGameStore();
    const [hasHover, setHasHover] = useState(true);

    useEffect(() => {
        setHasHover(window.matchMedia('(hover: hover)').matches);
    }, []);

    const handleUnequip = async (item, category) => {
        if (!isMe || !item || !roomCode) return;
        const pool = roomData?.pool;
        if (!pool || !pool[category]) return;

        // Ищем ключ предмета в Firebase pool
        const itemEntry = Object.entries(pool[category]).find(([_, val]) => val.id === item.id && val.claimedBy === uid);
        if (itemEntry) {
            const [itemKey] = itemEntry;
            await update(ref(db, `rooms/${roomCode}/pool/${category}/${itemKey}`), {
                claimedBy: null
            });
        }
    };

    const filledCount = [build.primary, build.secondary, build.grenade, build.armor, build.booster]
        .filter(Boolean).length + (build.stratagems?.filter(Boolean).length || 0);

    let statusText = "INCOMPLETE";
    let statusStyle = "text-amber-400/80 bg-amber-500/10 border-amber-500/30";

    if (isReady) {
        statusText = "READY FOR DROP";
        statusStyle = "text-hcGreen bg-hcGreen/10 border-hcGreen/40 font-bold";
    } else if (filledCount === 9) {
        statusText = "LOADOUT READY";
        statusStyle = "text-hcAccent bg-hcAccent/10 border-hcAccent/30 font-bold";
    } else if (filledCount > 0) {
        statusText = "SELECTING...";
        statusStyle = "text-hcMuted bg-hcDark border-hcBorder font-semibold";
    }

    return (
        <div className={`theme-panel border ${isMe ? 'border-hcAccent shadow-[0_0_15px_rgba(210,185,54,0.1)]' : 'border-hcBorder'} rounded-lg p-2 sm:p-3 flex flex-col relative`}>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-hcBorder pb-2 mb-2 sm:mb-3">
                <span className={`font-black uppercase tracking-widest text-xs sm:text-sm truncate pr-2 ${isMe ? 'text-hcAccent' : 'text-hcMuted'}`}>
                    {playerName || 'Unknown Helldiver'}
                </span>
                <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap transition-colors ${statusStyle}`}>
                    {statusText}
                </span>
            </div>

            {/* Row 1: Armor (col-span-2), Гранаты (col-span-1), Бустер (col-span-1) */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="col-span-2">
                    <ArmorSlot item={build.armor} isMe={isMe} onUnequip={() => handleUnequip(build.armor, 'armor')} onSelectCategory={onSelectCategory} hasHover={hasHover} />
                </div>
                <div className="col-span-1">
                    <Slot item={build.grenade} label="Grenade" type="item" category="grenade" isMe={isMe} onUnequip={() => handleUnequip(build.grenade, 'grenade')} onSelectCategory={onSelectCategory} hasHover={hasHover} isThrowable={true} />
                </div>
                <div className="col-span-1">
                    <Slot item={build.booster} label="Booster" type="booster" category="booster" isMe={isMe} onUnequip={() => handleUnequip(build.booster, 'booster')} onSelectCategory={onSelectCategory} hasHover={hasHover} />
                </div>
            </div>

            {/* Row 2: Expanded Основное & Вторичное Weapons */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <Slot item={build.primary} label="Primary" type="item" category="primary" isMe={isMe} onUnequip={() => handleUnequip(build.primary, 'primary')} onSelectCategory={onSelectCategory} hasHover={hasHover} isExpanded={true} />
                <Slot item={build.secondary} label="Secondary" type="item" category="secondary" isMe={isMe} onUnequip={() => handleUnequip(build.secondary, 'secondary')} onSelectCategory={onSelectCategory} hasHover={hasHover} isExpanded={true} />
            </div>

            {/* Row 3: Stratagems */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 border-t border-hcBorder pt-2 sm:pt-3">
                 {[0, 1, 2, 3].map(idx => {
                     const strat = build.stratagems[idx];
                     return (
                         <Slot 
                             key={idx} 
                             item={strat} 
                             label={`S${idx + 1}`} 
                             type="stratagem" 
                             category="stratagems"
                             isMe={isMe} 
                             onUnequip={() => handleUnequip(strat, 'stratagems')} 
                             onSelectCategory={onSelectCategory}
                             hasHover={hasHover}
                         />
                     );
                 })}
            </div>
        </div>
    );
}

function Slot({ item, label, type, category, isMe, onUnequip, onSelectCategory, hasHover, isExpanded, isThrowable }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setShowTooltip(false);
            }
        };
        if (showTooltip) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showTooltip]);

    const handleClick = () => {
        if (!hasHover) {
            setShowTooltip(!showTooltip);
        } else if (isMe) {
            onUnequip();
        }
    };

    const slotHeight = isExpanded ? "h-16 sm:h-20" : "h-14 sm:h-16";

    if (!item) {
        return (
            <div 
                onClick={() => isMe && onSelectCategory?.(category)}
                className={`theme-inner-panel border border-hcBorder border-dashed rounded flex items-center justify-center p-1 min-h-[44px] ${slotHeight} relative ${isMe ? 'cursor-pointer hover:border-hcAccent hover:bg-hcAccent/5 transition-colors' : ''}`}
                title={isMe ? `Выбрать ${category}` : undefined}
            >
                 <span className="text-[8px] sm:text-[9px] text-hcMuted uppercase font-mono absolute bottom-0.5 sm:bottom-1 w-full text-center truncate px-0.5">{label}</span>
            </div>
        );
    }

    const imagePath = type === 'stratagem' 
        ? `/assets/stratagems/${item.imageURL}`
        : `/assets/images/${item.imageURL}`;

    return (
        <div 
            ref={tooltipRef}
            onClick={handleClick}
            onMouseEnter={() => hasHover && setShowTooltip(true)}
            onMouseLeave={() => hasHover && setShowTooltip(false)}
            className={`theme-inner-panel border ${type === 'stratagem' ? 'border-hcBlue/50 bg-hcBlue/5' : 'border-hcBorder'} rounded flex items-center justify-center p-1 sm:p-2 min-h-[44px] ${slotHeight} group relative overflow-hidden ${isMe || !hasHover ? 'cursor-pointer hover:border-red-500/70 hover:opacity-80' : ''}`}
            title={hasHover && isMe ? 'Нажмите, чтобы снять предмет' : undefined}
        >
           <img 
               src={imagePath} 
               alt={item.name} 
               className={`object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none transition-transform ${isThrowable ? 'max-h-[115%] max-w-[115%] scale-125' : 'max-h-full max-w-full'}`} 
               onError={(e) => { e.target.style.opacity = '0.3'; }} 
           />
           {/* Popover / Tooltip */}
           {showTooltip && (
               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 theme-panel border border-hcBorder text-white text-[11px] sm:text-xs p-2.5 rounded z-[60] min-w-[140px] shadow-2xl flex flex-col gap-2 items-center text-center cursor-default" onClick={e => e.stopPropagation()}>
                    <div className="font-bold text-hcAccent">{item.name}</div>
                    {!hasHover && isMe && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowTooltip(false); onUnequip(); }}
                            className="bg-red-900/90 hover:bg-red-700 text-white px-3 py-2 rounded text-[10px] uppercase tracking-wider w-full min-h-[44px] flex items-center justify-center border border-red-500/30 transition-colors mt-1"
                        >
                            Unequip
                        </button>
                    )}
                    {hasHover && (
                        <div className="text-[10px] text-gray-400">
                            {isMe ? 'Click to unequip' : 'Equipped'}
                        </div>
                    )}
               </div>
           )}
         </div>
    );
}

function ArmorSlot({ item, isMe, onUnequip, onSelectCategory, hasHover }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setShowTooltip(false);
            }
        };
        if (showTooltip) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showTooltip]);

    const handleClick = () => {
        if (!hasHover) {
            setShowTooltip(!showTooltip);
        } else if (isMe) {
            onUnequip();
        }
    };

    if (!item) {
        return (
            <div 
                onClick={() => isMe && onSelectCategory?.('armor')}
                className={`theme-inner-panel border border-hcBorder border-dashed rounded flex flex-col items-center justify-center p-1 min-h-[44px] h-14 sm:h-16 relative ${isMe ? 'cursor-pointer hover:border-hcAccent hover:bg-hcAccent/5 transition-colors' : ''}`}
                title={isMe ? 'Выбрать броню' : undefined}
            >
                 <span className="text-[8px] sm:text-[9px] text-hcMuted uppercase font-mono absolute bottom-0.5 sm:bottom-1">Armor</span>
            </div>
        );
    }

    return (
        <div 
            ref={tooltipRef}
            onClick={handleClick}
            onMouseEnter={() => hasHover && setShowTooltip(true)}
            onMouseLeave={() => hasHover && setShowTooltip(false)}
            className={`theme-inner-panel border border-hcBorder rounded min-h-[44px] h-14 sm:h-16 flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2.5 relative group overflow-hidden ${isMe || !hasHover ? 'cursor-pointer hover:border-red-500/70 hover:opacity-80' : ''}`}
            title={hasHover && isMe ? 'Нажмите, чтобы снять броню' : undefined}
        >
            <div className="w-7 sm:w-9 h-9 sm:h-11 flex-shrink-0 flex items-center justify-center">
                <img 
                    src={`/armor/${item.imageURL}`} 
                    alt={item.name} 
                    className="max-h-full max-w-full object-contain filter drop-shadow pointer-events-none" 
                    onError={(e) => { e.target.style.opacity = '0.3'; }}
                />
            </div>
            <div className="flex flex-col justify-center overflow-hidden min-w-0 flex-1">
                <span className="text-[9px] sm:text-xs font-bold text-white truncate leading-tight mb-0.5">{item.name}</span>
                <div className="hidden min-[380px]:block overflow-hidden">
                    <ArmorDisplay item={item} compact={true} showImage={false} showTooltip={false} />
                </div>
            </div>

            {/* Popover / Tooltip */}
            {showTooltip && (
                <div 
                    className="absolute bottom-full left-0 sm:left-1/2 transform sm:-translate-x-1/2 mb-2 flex flex-col gap-1.5 bg-neutral-900 border border-hcBorder text-white text-[11px] p-3 rounded z-[60] w-64 sm:min-w-[220px] sm:max-w-[260px] shadow-2xl cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="font-bold text-hcAccent mb-1">{item.name}</div>
                    <ArmorDisplay item={item} compact={false} showImage={false} showTooltip={false} />
                    
                    {!hasHover && isMe && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowTooltip(false); onUnequip(); }}
                            className="bg-red-900/90 hover:bg-red-700 text-white px-3 py-2 mt-2 rounded text-[10px] uppercase tracking-wider w-full min-h-[44px] flex items-center justify-center border border-red-500/30 transition-colors"
                        >
                            Unequip Armor
                        </button>
                    )}
                    {hasHover && isMe && (
                        <div className="text-[10px] text-gray-400 mt-1 text-center border-t border-hcBorder pt-1">
                            Click to unequip
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

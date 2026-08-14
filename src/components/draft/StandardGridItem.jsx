import React from 'react';
import { ShieldAlert, ShoppingBag } from 'lucide-react';
import SteamInset from '../ui/SteamInset';
import SteamButton from '../ui/SteamButton';

export default function StandardGridItem({
    item,
    category,
    status,
    showDebugNames,
    hasHover,
    showTooltip,
    onItemClick,
    onPerformAction
}) {
    const { isMine, isTaken, isLocked, isSuperstore } = status;
    const code = item.warbondCode || item.code;

    let borderClass = 'border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] cursor-pointer';
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

    const isWeapon = category === 'primary' || category === 'secondary';
    const aspectClass = isWeapon ? 'aspect-[16/9] p-1.5 sm:p-2' : 'aspect-square p-2';

    const imagePath = category === 'stratagems' 
        ? `/assets/stratagems/${item.imageURL}`
        : `/assets/images/${item.imageURL}`;

    return (
        <SteamInset
            onClick={(e) => onItemClick(e, item)}
            className={`${aspectClass} rounded flex flex-col items-center justify-center relative group transition-all min-h-[44px] overflow-hidden ${borderClass} ${opacityClass}`}
        >
            {showDebugNames && (
                <div className="absolute top-0 left-0 right-0 z-30 bg-yellow-400 text-black font-mono text-[8px] font-bold px-0.5 py-0.5 text-center truncate border-b border-black leading-none">
                    {item.id} | {code || 'base'}
                </div>
            )}
            
            <img 
                src={imagePath} 
                alt={item.name} 
                className="w-full h-full object-contain filter drop-shadow-md pointer-events-none transform group-hover:scale-105 transition-transform" 
                onError={(e) => { e.target.src = ''; }} 
            />
            
            {isSuperstore && (
                <div className="absolute bottom-1 right-1 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" title="Superstore">
                    <ShoppingBag size={12} className="text-cyan-400" />
                </div>
            )}

            {isTaken && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40">
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
                        <SteamButton 
                            variant={isMine ? 'danger' : 'primary'}
                            onClick={(e) => { e.stopPropagation(); onPerformAction(item); }}
                            className="w-full min-h-[44px] text-xs font-bold uppercase tracking-widest"
                        >
                            {isMine ? 'Unequip' : 'Equip'}
                        </SteamButton>
                    )}
                    {/* Popover Arrow */}
                    <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black border-r border-b border-hcBorder rotate-45"></div>
                </div>
            )}
        </SteamInset>
    );
}

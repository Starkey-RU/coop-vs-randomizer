import React from 'react';
import { ShoppingBag } from 'lucide-react';
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
        borderClass = 'border-2 border-yellow-400 bg-yellow-500/10 shadow-[inset_0_0_8px_rgba(250,204,21,0.2)]';
    } else if (isTaken) {
        borderClass = 'border-red-900/60 bg-red-950/20 cursor-not-allowed';
        opacityClass = 'opacity-35 grayscale';
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

            {/* Selection badges */}
            {isMine && (
                <div className="absolute top-1 right-1 z-20 bg-black/90 text-yellow-400 border border-yellow-400 text-[8px] font-mono font-bold px-1 py-0.2 tracking-wider">
                    [ ВЫБРАНО ]
                </div>
            )}

            {isTaken && (
                <div className="absolute top-1 right-1 z-20 bg-black/90 text-red-400 border border-red-800 text-[8px] font-mono font-bold px-1 py-0.2 tracking-wider">
                    [ ЗАНЯТО ]
                </div>
            )}
            
            <img 
                src={imagePath} 
                alt={item.name} 
                className="w-full h-full object-contain filter drop-shadow-md pointer-events-none transform group-hover:scale-105 transition-transform" 
                onError={(e) => {
                    const src = e.target.src;
                    if (src.endsWith('.svg')) {
                        e.target.src = src.replace('.svg', '.webp');
                    } else if (src.endsWith('.webp')) {
                        e.target.src = src.replace('.webp', '.png');
                    } else {
                        e.target.style.display = 'none';
                    }
                }} 
            />
            
            {isSuperstore && (
                <div className="absolute bottom-1 right-1 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none" title="Superstore">
                    <ShoppingBag size={12} className="text-cyan-400" />
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
                    {isMine && <span className="text-[10px] text-yellow-400 ml-2 font-mono">[ ВЫБРАНО ВАМИ ]</span>}
                    {isTaken && <span className="text-[10px] text-red-400 ml-2 font-mono">[ ЗАНЯТО СОЮЗНИКОМ ]</span>}
                    {isLocked && <span className="text-[10px] text-red-400 ml-2 font-mono">[ НЕТ ЛИЦЕНЗИИ ]</span>}
                </div>
            )}

            {/* Mobile / Touch Tap Action Tooltip */}
            {showTooltip && (
                <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-1.5 gap-1 rounded animate-in fade-in zoom-in-95">
                    <span className="text-[10px] font-bold text-white text-center leading-tight truncate w-full px-1">
                        {item.name}
                    </span>
                    <SteamButton
                        variant={isMine ? 'danger' : 'primary'}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPerformAction(item);
                        }}
                        className="py-1 px-2 text-[9px] font-bold uppercase tracking-wider w-full min-h-[32px]"
                    >
                        {isMine ? 'Снять' : isTaken ? 'Занято' : 'Выбрать'}
                    </SteamButton>
                </div>
            )}
        </SteamInset>
    );
}

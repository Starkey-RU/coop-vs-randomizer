import React from 'react';
import ArmorDisplay from '../ui/ArmorDisplay';
import SteamInset from '../ui/SteamInset';
import SteamButton from '../ui/SteamButton';

export default function ArmorGridItem({ 
    item, 
    status, 
    showDebugNames, 
    hasHover, 
    showTooltip, 
    onItemClick, 
    onPerformAction 
}) {
    const { isMine, isTaken, isLocked } = status;
    const code = item.warbondCode || item.code;

    let borderClass = 'border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] cursor-pointer';
    let opacityClass = 'opacity-100';

    if (isMine) {
        borderClass = 'border-2 border-yellow-400 bg-yellow-500/10 shadow-[inset_0_0_8px_rgba(250,204,21,0.2)]';
    } else if (isTaken) {
        borderClass = 'border-red-900/60 bg-red-950/20 cursor-not-allowed';
        opacityClass = 'opacity-35 grayscale';
    } else if (isLocked) {
        borderClass = 'border-red-900/40 bg-black/40 cursor-not-allowed';
        opacityClass = 'opacity-60';
    }

    return (
        <SteamInset
            onClick={(e) => onItemClick(e, item)}
            className={`relative h-44 sm:h-46 rounded flex flex-col justify-between transition-all group overflow-visible bg-hcPanel ${borderClass} ${opacityClass}`}
        >
            <div className="flex-1 w-full relative min-h-0 bg-hcDark/30 p-1 flex items-center justify-center overflow-hidden">
                {showDebugNames && (
                    <div className="absolute top-0 left-0 right-0 z-30 bg-yellow-400 text-black font-mono text-[9px] font-bold px-1 py-0.5 text-center truncate border-b border-black shadow">
                        {item.id} | {code || 'base'}
                    </div>
                )}

                {/* Selection badges */}
                {isMine && (
                    <div className="absolute top-1 right-1 z-30 bg-black/90 text-yellow-400 border border-yellow-400 text-[8px] font-mono font-bold px-1 py-0.2 tracking-wider">
                        [ ВЫБРАНО ]
                    </div>
                )}

                {isTaken && (
                    <div className="absolute top-1 right-1 z-30 bg-black/90 text-red-400 border border-red-800 text-[8px] font-mono font-bold px-1 py-0.2 tracking-wider">
                        [ ЗАНЯТО ]
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
                <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-2 gap-2 rounded animate-in fade-in zoom-in-95">
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

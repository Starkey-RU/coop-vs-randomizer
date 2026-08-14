import React from 'react';
import { ShieldAlert } from 'lucide-react';
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
        borderClass = 'border-hcAccent bg-hcAccent/10 shadow-[0_0_10px_rgba(210,185,54,0.2)]';
    } else if (isTaken) {
        borderClass = 'border-red-900/60 bg-red-900/10 cursor-not-allowed';
        opacityClass = 'opacity-40 grayscale';
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
                    <SteamButton 
                        variant={isMine ? 'danger' : 'primary'}
                        onClick={(e) => { e.stopPropagation(); onPerformAction(item); }}
                        className="min-h-[44px] w-full max-w-[200px] text-xs font-bold uppercase tracking-widest"
                    >
                        {isMine ? 'Unequip' : 'Equip Armor'}
                    </SteamButton>
                 </div>
            )}
        </SteamInset>
    );
}

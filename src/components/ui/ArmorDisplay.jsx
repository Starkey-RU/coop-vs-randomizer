import React from 'react';
import { getArmorWeightMeta, getArmorPassiveMeta, getItemSourceMeta, getArmorPassiveIconPath } from '../../utils/armorRegistry';
import { Shield } from 'lucide-react';

export default function ArmorDisplay({ item, compact = false, showImage = true, showTooltip = true }) {
    if (!item) return null;

    try {
        const weightMeta = getArmorWeightMeta(item.tags || []) || { label: 'Medium', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: Shield };
        const passiveMeta = getArmorPassiveMeta(item.passive);
        const sourceMeta = getItemSourceMeta(item) || { label: 'Base', isSuperstore: false, icon: null, color: 'text-gray-400', hasIcon: false };
        const passiveIconPath = getArmorPassiveIconPath(item.passive);

        const WeightIcon = typeof weightMeta.icon === 'function' || typeof weightMeta.icon === 'object' ? weightMeta.icon : Shield;
        const PassiveIcon = passiveMeta && (typeof passiveMeta.icon === 'function' || typeof passiveMeta.icon === 'object') ? passiveMeta.icon : null;
        const SourceIcon = sourceMeta && (typeof sourceMeta.icon === 'function' || typeof sourceMeta.icon === 'object') ? sourceMeta.icon : null;

        if (compact) {
            return (
                <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
                    {/* Weight badge (Pure Icon ONLY) */}
                    <span 
                        className={`h-5 w-5 inline-flex items-center justify-center rounded border shrink-0 ${weightMeta.bgColor || ''} ${weightMeta.color || ''} ${weightMeta.borderColor || ''}`}
                        title={`Класс: ${weightMeta.label}`}
                    >
                        {WeightIcon && <WeightIcon size={12} />}
                    </span>

                    {/* Passive badge icon */}
                    {passiveIconPath ? (
                        <span 
                            className="h-5 w-5 inline-flex items-center justify-center p-0.5 rounded border border-hcBorder bg-hcDark shrink-0"
                            title={`${passiveMeta?.name || ''}: ${passiveMeta?.desc || ''}`}
                        >
                            <img src={passiveIconPath} alt={item.passive || 'Passive'} className="w-3.5 h-3.5 object-contain" />
                        </span>
                    ) : passiveMeta && (
                        <span 
                            className={`h-5 inline-flex items-center gap-1 px-1.5 rounded text-[9px] font-semibold border border-hcBorder bg-hcDark shrink-0 ${passiveMeta.color || ''}`}
                            title={`${passiveMeta.name || ''}: ${passiveMeta.desc || ''}`}
                        >
                            {PassiveIcon && <PassiveIcon size={10} />}
                            <span className="truncate max-w-[80px]">{passiveMeta.name}</span>
                        </span>
                    )}

                    {/* Source / Warbond badge */}
                    <span 
                        className={`h-5 inline-flex items-center gap-1 px-1.5 rounded text-[9px] font-semibold border shrink-0 ${sourceMeta.bgColor || ''} ${sourceMeta.color || ''} ${sourceMeta.borderColor || ''}`}
                        title={`Источник: ${sourceMeta.label}`}
                    >
                        {SourceIcon && <SourceIcon size={10} />}
                        <span className="truncate max-w-[80px]">{sourceMeta.label}</span>
                    </span>
                </div>
            );
        }

        return (
            <div className="w-full h-full relative group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors hover:z-[60] bg-hcPanel flex flex-col overflow-visible steam-inset-box">
                <div className="flex-1 w-full relative min-h-0 bg-hcDark/30">
                    {showImage && (
                        <img 
                            src={`/armor/${item.imageURL}`} 
                            alt={item.name} 
                            className="absolute inset-0 w-full h-full object-contain filter drop-shadow-md z-0 transform scale-[1.1]"
                            onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                    )}
                    <div className="absolute top-1 left-1 flex flex-col gap-1 z-10">
                        <div className={`${weightMeta.bgColor || 'bg-black/80'} ${weightMeta.color} border ${weightMeta.borderColor} rounded-sm p-1 shadow-sm`} title={weightMeta.label}>
                            <WeightIcon size={12} />
                        </div>
                    </div>
                </div>

                <div className="shrink-0 px-1 py-1 bg-black/60 border-t border-[var(--steam-border-dark)] z-10">
                    <span className="text-[9px] block text-center text-gray-300 uppercase font-black leading-tight truncate px-0.5 tracking-wide">
                        {item.name.replace("'", "")}
                    </span>
                </div>

                {showTooltip && (
                    <div className="absolute w-[220px] top-0 left-[105%] ml-2 p-2 bg-hcDark border border-[var(--steam-border-light)] z-[999] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-[0_0_15px_rgba(0,0,0,0.8)] rounded-sm flex flex-col gap-1.5 isolate">
                        <h4 className="font-bold text-xs text-white border-b border-hcBorder/40 pb-1">{item.name.replace("'", "")}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-white">
                            <WeightIcon size={12} className={weightMeta.color} />
                            <span className="uppercase font-bold tracking-widest">{weightMeta.label} Armor</span>
                        </div>
                        {passiveMeta && (
                            <div className="flex flex-col gap-1 mt-1 bg-black/40 p-1.5 rounded border border-hcBorder/20">
                                <div className="flex items-center gap-1.5 text-hcYellow font-bold text-[10px] uppercase tracking-wider">
                                    {passiveIconPath && <img src={passiveIconPath} alt="" className="w-3.5 h-3.5" />}
                                    <span>{passiveMeta.name}</span>
                                </div>
                                {passiveMeta.desc && <p className="text-[9px] text-slate-300 leading-tight">{passiveMeta.desc}</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    } catch (err) {
        console.error('ArmorDisplay error failsafe:', err);
        return (
            <div className="p-1 theme-inner-panel text-[10px] text-gray-400 rounded">
                {item.name || 'Armor'}
            </div>
        );
    }
}

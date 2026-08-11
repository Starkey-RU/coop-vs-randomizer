import React, { useState } from 'react';
import { X, Calendar, User, Clock, ChevronRight } from 'lucide-react';
import ArmorDisplay from '../ui/ArmorDisplay';

export default function HistoryModal({ isOpen, onClose, history }) {
    const [selectedMission, setSelectedMission] = useState(null);

    if (!isOpen || !history) return null;

    const missions = Object.entries(history).sort((a, b) => {
        const numA = parseInt(a[0].replace('mission_', '')) || 0;
        const numB = parseInt(b[0].replace('mission_', '')) || 0;
        return numB - numA;
    });

    if (missions.length === 0) {
        return (
            <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-hcPanel border border-hcBorder rounded-lg p-6 max-w-md w-full text-center relative shadow-2xl">
                    <button onClick={onClose} className="absolute top-3 right-3 text-hcMuted hover:text-white">
                        <X size={20} />
                    </button>
                    <Clock size={48} className="mx-auto text-hcMuted/40 mb-3" />
                    <h3 className="text-lg font-bold uppercase tracking-wider text-white mb-2">История операций пуста</h3>
                    <p className="text-xs text-hcMuted font-mono">Высадки ещё не производились в данной сессии.</p>
                </div>
            </div>
        );
    }

    const activeKey = selectedMission || missions[0][0];
    const activeData = history[activeKey];

    return (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-hcPanel border border-hcBorder rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 border-b border-hcBorder flex justify-between items-center bg-black/40">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-hcAccent" />
                        <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-widest">
                            История Операций Отряда
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-hcMuted hover:text-white rounded transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Mission Sidebar */}
                    <div className="w-full md:w-64 border-r border-hcBorder/60 bg-black/20 p-2 overflow-y-auto flex md:flex-col gap-1.5 shrink-0">
                        {missions.map(([mKey, mData]) => {
                            const isSelected = mKey === activeKey;
                            const dateStr = mData.timestamp 
                                ? new Date(mData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                : '';

                            return (
                                <button
                                    key={mKey}
                                    onClick={() => setSelectedMission(mKey)}
                                    className={`p-2.5 rounded text-left flex items-center justify-between transition-colors min-h-[44px] ${
                                        isSelected 
                                            ? 'bg-hcAccent/20 border border-hcAccent text-hcAccent font-bold' 
                                            : 'hover:bg-hcDark text-hcMuted hover:text-white border border-transparent'
                                    }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="uppercase tracking-wider text-xs">
                                            Высадка #{mKey.replace('mission_', '')}
                                        </span>
                                        {dateStr && <span className="text-[10px] text-hcMuted font-mono">{dateStr}</span>}
                                    </div>
                                    <ChevronRight size={14} className={isSelected ? 'opacity-100' : 'opacity-40'} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Mission Loadouts Display */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                        {activeData && activeData.squadLoadouts ? (
                            Object.entries(activeData.squadLoadouts).map(([pUid, pData]) => {
                                const build = pData.build || {};
                                const stratagems = build.stratagems || [];

                                return (
                                    <div key={pUid} className="bg-hcDark/80 border border-hcBorder/60 rounded-lg p-3 flex flex-col gap-2">
                                        <div className="flex items-center justify-between border-b border-hcBorder/40 pb-1.5">
                                            <span className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                                                <User size={14} className="text-hcAccent" />
                                                {pData.name || 'Helldiver'}
                                            </span>
                                        </div>

                                        {/* Equipment Summary Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                                            <MiniItemSlot item={build.primary} label="Primary" />
                                            <MiniItemSlot item={build.secondary} label="Secondary" />
                                            <MiniItemSlot item={build.grenade} label="Grenade" />
                                            <MiniItemSlot item={build.booster} label="Booster" />
                                            <div className="col-span-2 sm:col-span-1">
                                                {build.armor ? (
                                                    <ArmorDisplay item={build.armor} compact={true} showImage={false} showTooltip={false} />
                                                ) : (
                                                    <span className="text-[10px] text-hcMuted uppercase font-mono">No Armor</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stratagems Row */}
                                        <div className="grid grid-cols-4 gap-1.5 border-t border-hcBorder/30 pt-2 mt-1">
                                            {[0, 1, 2, 3].map(idx => {
                                                const strat = stratagems[idx];
                                                return (
                                                    <div key={idx} className="aspect-square bg-black/40 border border-hcBorder/40 rounded flex items-center justify-center p-1 relative group">
                                                        {strat ? (
                                                            <img 
                                                                src={`/assets/stratagems/${strat.imageURL}`} 
                                                                alt={strat.name} 
                                                                className="w-full h-full object-contain filter drop-shadow" 
                                                                onError={e => e.target.style.opacity = '0.3'}
                                                                title={strat.name}
                                                            />
                                                        ) : (
                                                            <span className="text-[9px] text-hcMuted uppercase font-mono">Empty</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10 text-hcMuted text-xs">
                                Нет данных о снаряжении для этой высадки
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniItemSlot({ item, label }) {
    if (!item) return <span className="text-[10px] text-hcMuted uppercase font-mono">{label}: —</span>;
    return (
        <div className="flex flex-col truncate" title={item.name}>
            <span className="text-[9px] text-hcMuted uppercase leading-none">{label}</span>
            <span className="text-white text-[11px] font-bold truncate leading-tight">{item.name}</span>
        </div>
    );
}

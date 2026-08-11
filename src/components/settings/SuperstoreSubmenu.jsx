import React, { useMemo, useState } from 'react';
import { getSuperstoreItems } from '../../utils/superstoreHelpers';
import { Check, Search, ShoppingBag } from 'lucide-react';
import ArmorDisplay from '../ui/ArmorDisplay';

export default function SuperstoreSubmenu({ owned, toggleWarbond }) {
    const superstoreItems = useMemo(() => getSuperstoreItems(), []);
    const [searchQuery, setSearchQuery] = useState('');

    if (superstoreItems.length === 0) {
        return <div className="text-gray-500 text-xs p-2">Предметы Superstore не найдены</div>;
    }

    const filteredItems = superstoreItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.passive && item.passive.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200 mt-2">
            
            <div className="flex items-center gap-2 bg-black/20 border border-gray-700 p-2 sm:p-2 min-h-[44px] rounded">
                <Search size={14} className="text-gray-500 shrink-0" />
                <input 
                    type="text" 
                    placeholder="Поиск..." 
                    className="bg-transparent outline-none text-xs w-full text-white placeholder-gray-600 font-sans h-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {filteredItems.map(item => {
                    const isOwned = owned.includes(item.id);
                    const imagePath = item.type === 'armor' 
                        ? `/armor/${item.imageURL}` 
                        : `/assets/images/${item.imageURL}`;

                    return (
                        <div
                            key={item.id}
                            onClick={() => toggleWarbond(item.id)}
                            className={`relative cursor-pointer transition-all duration-200 border-2 rounded-lg p-1.5 flex flex-col items-center justify-between h-32 w-full ${
                                isOwned 
                                ? 'border-hcAccent bg-hcAccent/10 shadow-[0_0_12px_rgba(210,185,54,0.15)]' 
                                : 'border-hcBorder/60 bg-black/40 opacity-70 hover:opacity-100 hover:border-gray-500'
                            }`}
                            title={item.name}
                        >
                            {/* Owned Checkmark */}
                            {isOwned && (
                                <div className="absolute top-1 right-1 bg-hcGreen text-black p-0.5 rounded shadow z-20">
                                    <Check size={10} strokeWidth={4} />
                                </div>
                            )}

                            {/* Item Image / Armor Display */}
                            {item.type === 'armor' ? (
                                <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                                    <ArmorDisplay item={item} compact={false} showImage={true} showTooltip={false} />
                                </div>
                            ) : (
                                <div className="w-full flex-1 flex items-center justify-center p-1">
                                    <img 
                                        src={imagePath} 
                                        alt={item.name} 
                                        className="max-h-full max-w-full object-contain filter drop-shadow" 
                                        onError={(e) => { e.target.style.opacity = '0.3'; }} 
                                    />
                                </div>
                            )}

                            {/* Superstore Bag Badge */}
                            <div className="absolute top-1 left-1 z-20 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none">
                                <ShoppingBag size={11} className="text-cyan-400" />
                            </div>

                            {/* Title Label (Only for non-armor, as ArmorDisplay renders its own title) */}
                            {item.type !== 'armor' && (
                                <span className="text-[9px] font-bold text-slate-100 text-center truncate w-full pt-1 border-t border-hcBorder/40 leading-none">
                                    {item.name}
                                </span>
                            )}
                        </div>
                    );
                })}
                
                {filteredItems.length === 0 && (
                    <div className="text-gray-500 text-xs py-4 col-span-full text-center">
                        Ничего не найдено по запросу "{searchQuery}"
                    </div>
                )}
            </div>
        </div>
    );
}

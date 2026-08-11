import React, { useState, useEffect } from 'react';
import { WARBONDS, LEGENDARY_WARBONDS, getDefaultWarbonds } from '../../utils/warbondRegistry';
import SuperstoreSubmenu from './SuperstoreSubmenu';
import { Save, X, ChevronDown, ChevronRight, ShoppingCart } from 'lucide-react';

export default function WarbondSettings({ onClose }) {
    const [owned, setOwned] = useState([]);
    const [storeOpen, setStoreOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('bingo_owned_warbonds');
        if (saved) {
            try {
                setOwned(JSON.parse(saved));
            } catch (e) {
                setOwned(getDefaultWarbonds());
            }
        } else {
            setOwned(getDefaultWarbonds());
        }
    }, []);

    const toggleWarbond = (code) => {
        setOwned(prev => 
            prev.includes(code) 
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    const handleSave = () => {
        localStorage.setItem('bingo_owned_warbonds', JSON.stringify(owned));
        
        // Push the update to Firebase immediately if inside a room
        import('../../store/useGameStore').then(({ default: useGameStore }) => {
             const sync = useGameStore.getState().syncWarbonds;
             if (sync) sync();
        });

        if (onClose) onClose();
    };

    const selectAll = () => {
        const allCodes = [
            ...WARBONDS.map(w => w.code),
            ...LEGENDARY_WARBONDS.map(w => w.code)
            // Note: We don't auto-select all 60 superstore items for UI sanity,
            // they can be checked manually in the submenu if desired.
        ];
        setOwned(allCodes);
    };
    
    const clearAll = () => setOwned([]);

    const renderCheckboxList = (items) => {
        return items.map(wb => (
            <label key={wb.code} className="flex items-center gap-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 cursor-pointer group">
                <input 
                    type="checkbox" 
                    className="theme-input w-5 h-5 sm:w-4 sm:h-4 cursor-pointer accent-hcAccent shrink-0"
                    checked={owned.includes(wb.code)}
                    onChange={() => toggleWarbond(wb.code)}
                />
                <span className={`font-bold transition-colors text-[10px] sm:text-xs tracking-wider uppercase leading-tight ${owned.includes(wb.code) ? 'theme-highlight text-hcAccent' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {wb.name}
                </span>
            </label>
        ));
    };

    // Calculate how many superstore items are owned
    // To do this strictly, we could import DB, but as a quick UI hack we can just check 
    // how many items in `owned` do NOT start with "warbond"
    const ownedStoreItemsCount = owned.filter(id => !id.startsWith('warbond')).length;

    return (
        <div className="steam-dialog-window theme-panel flex flex-col gap-3 p-1">
            <div className="steam-dialog-header">
                <span>Steam Options — Warbonds & Superstore Catalog</span>
                <div className="flex gap-1">
                    <button onClick={selectAll} className="steam-tab-btn text-[10px] py-2 px-3 sm:py-0.5 sm:px-2 min-h-[44px] sm:min-h-0 flex items-center justify-center font-bold" title="Выбрать все варбонды">All</button>
                    <button onClick={clearAll} className="steam-tab-btn text-[10px] py-2 px-3 sm:py-0.5 sm:px-2 min-h-[44px] sm:min-h-0 flex items-center justify-center font-bold" title="Отменить весь выбор">Clear</button>
                </div>
            </div>

            <p className="text-xs text-gray-400 px-2 italic font-mono">
                Оружие, броня и стратагемы будут отфильтрованы по купленным лицензиям.
            </p>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 max-h-[55vh] flex flex-col gap-4" style={{ minHeight: '200px' }}>
                
                {/* Regular Warbonds */}
                <div className="steam-group-box relative pt-4 pb-3 px-3">
                    <span className="steam-group-box-title">Стандартные Warbonds</span>
                    <div className="steam-inset-box p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {renderCheckboxList(WARBONDS)}
                    </div>
                </div>

                {/* Legendary Status */}
                <div className="steam-group-box relative pt-4 pb-3 px-3">
                    <span className="steam-group-box-title">Премиум Статусы (Legendary)</span>
                    <div className="steam-inset-box p-3 flex flex-col gap-2">
                        {renderCheckboxList(LEGENDARY_WARBONDS)}
                    </div>
                </div>

                {/* Superstore - Visual Submenu */}
                <div className="steam-group-box relative pt-4 pb-3 px-3 mb-2">
                    <button 
                        onClick={() => setStoreOpen(!storeOpen)}
                        className={`steam-tab-btn theme-button w-full py-3 px-3 min-h-[44px] flex items-center justify-between font-bold text-xs ${storeOpen ? 'active' : ''}`}
                    >
                        <span className="flex items-center gap-2">
                            <ShoppingCart size={14} className={storeOpen ? 'theme-highlight' : 'text-gray-400'} />
                            Каталог Superstore
                        </span>
                        <span className="flex items-center gap-2">
                            <span className={`text-[10px] ${ownedStoreItemsCount > 0 ? 'text-hcGreen' : 'text-gray-500'}`}>
                                ({ownedStoreItemsCount} шт. куплено)
                            </span>
                            {storeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                    </button>

                    {storeOpen && (
                        <div className="steam-inset-box p-2 mt-2">
                            <SuperstoreSubmenu owned={owned} toggleWarbond={toggleWarbond} />
                        </div>
                    )}
                </div>

            </div>

            <div className="flex justify-end gap-2 p-2 border-t" style={{ borderColor: 'var(--steam-border-dark)' }}>
                {onClose && <button onClick={onClose} className="theme-button px-4 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 text-xs font-bold">Cancel</button>}
                <button 
                    onClick={handleSave}
                    className="theme-button px-6 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 text-xs font-bold theme-highlight flex items-center gap-2"
                >
                    <Save size={14} /> Save & Apply
                </button>
            </div>
        </div>
    );
}


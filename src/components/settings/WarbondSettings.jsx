import React, { useState, useEffect } from 'react';
import { WARBONDS, LEGENDARY_WARBONDS, getDefaultWarbonds } from '../../utils/warbondRegistry';
import SuperstoreSubmenu from './SuperstoreSubmenu';
import { Save, X, ChevronDown, ChevronRight, ShoppingCart, ShieldCheck, Award } from 'lucide-react';

export default function WarbondSettings({ onClose }) {
    const [owned, setOwned] = useState([]);
    const [standardOpen, setStandardOpen] = useState(true);
    const [premiumOpen, setPremiumOpen] = useState(false);
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

    const ownedStandardCount = WARBONDS.filter(w => owned.includes(w.code)).length;
    const ownedPremiumCount = LEGENDARY_WARBONDS.filter(w => owned.includes(w.code)).length;
    const ownedStoreItemsCount = owned.filter(id => !WARBONDS.some(w => w.code === id) && !LEGENDARY_WARBONDS.some(w => w.code === id)).length;

    return (
        <div className="steam-dialog-window max-w-4xl w-full flex flex-col max-h-[85vh]">
            <div className="steam-dialog-header flex items-center justify-between p-[6px] px-2 cursor-move select-none">
                <span className="font-bold text-xs uppercase tracking-wider text-hcMuted">Owned Warbonds & Superstore</span>
                {onClose && (
                    <button onClick={onClose} className="theme-button p-1 hover:text-red-400">
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs pb-1 border-b" style={{ borderColor: 'var(--steam-border-dark)' }}>
                    <span className="text-gray-400">Total Unlocked: <b className="text-hcAccent">{owned.length}</b></span>
                    <div className="flex gap-1">
                        <button onClick={selectAll} className="steam-tab-btn text-[10px] py-2 px-3 sm:py-0.5 sm:px-2 min-h-[44px] sm:min-h-0 flex items-center justify-center font-bold" title="Select All">All</button>
                        <button onClick={clearAll} className="steam-tab-btn text-[10px] py-2 px-3 sm:py-0.5 sm:px-2 min-h-[44px] sm:min-h-0 flex items-center justify-center font-bold" title="Clear All">Clear</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 max-h-[55vh] flex flex-col gap-4" style={{ minHeight: '200px' }}>
                    
                    {/* Standard Warbonds */}
                    <div className="steam-group-box relative pt-2 pb-2 px-3">
                        <button 
                            onClick={() => setStandardOpen(!standardOpen)}
                            className={`steam-tab-btn theme-button w-full py-2.5 px-3 min-h-[44px] flex items-center justify-between font-bold text-xs ${standardOpen ? 'active' : ''}`}
                        >
                            <span className="flex items-center gap-2">
                                <ShieldCheck size={14} className={standardOpen ? 'theme-highlight' : 'text-gray-400'} />
                                Standard Warbonds
                            </span>
                            <span className="flex items-center gap-2">
                                <span className={`text-[10px] ${ownedStandardCount > 0 ? 'text-hcGreen' : 'text-gray-500'}`}>
                                    ({ownedStandardCount} / {WARBONDS.length})
                                </span>
                                {standardOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                        </button>
                        {standardOpen && (
                            <div className="steam-inset-box p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                {renderCheckboxList(WARBONDS)}
                            </div>
                        )}
                    </div>

                    {/* Premium / Legendary Warbonds */}
                    <div className="steam-group-box relative pt-2 pb-2 px-3">
                        <button 
                            onClick={() => setPremiumOpen(!premiumOpen)}
                            className={`steam-tab-btn theme-button w-full py-2.5 px-3 min-h-[44px] flex items-center justify-between font-bold text-xs ${premiumOpen ? 'active' : ''}`}
                        >
                            <span className="flex items-center gap-2">
                                <Award size={14} className={premiumOpen ? 'theme-highlight' : 'text-gray-400'} />
                                Premium & Legendary Warbonds
                            </span>
                            <span className="flex items-center gap-2">
                                <span className={`text-[10px] ${ownedPremiumCount > 0 ? 'text-hcGreen' : 'text-gray-500'}`}>
                                    ({ownedPremiumCount} / {LEGENDARY_WARBONDS.length})
                                </span>
                                {premiumOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                        </button>
                        {premiumOpen && (
                            <div className="steam-inset-box p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                {renderCheckboxList(LEGENDARY_WARBONDS)}
                            </div>
                        )}
                    </div>

                    {/* Superstore - Visual Submenu */}
                    <div className="steam-group-box relative pt-2 pb-2 px-3 mb-2">
                        <button 
                            onClick={() => setStoreOpen(!storeOpen)}
                            className={`steam-tab-btn theme-button w-full py-2.5 px-3 min-h-[44px] flex items-center justify-between font-bold text-xs ${storeOpen ? 'active' : ''}`}
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingCart size={14} className={storeOpen ? 'theme-highlight' : 'text-gray-400'} />
                                Superstore Catalog
                            </span>
                            <span className="flex items-center gap-2">
                                <span className={`text-[10px] ${ownedStoreItemsCount > 0 ? 'text-hcGreen' : 'text-gray-500'}`}>
                                    ({ownedStoreItemsCount} items unlocked)
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

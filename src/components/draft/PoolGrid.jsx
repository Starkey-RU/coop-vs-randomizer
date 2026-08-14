import React, { useState, useEffect } from 'react';
import useGameStore from '../../store/useGameStore';
import { useDraft } from '../../hooks/useDraft';
import RulesEngine from '../../utils/RulesEngine';
import { groupItemsBySubcategory, getGridCols, getItemStatus } from '../../utils/itemGrouping';
import { Crosshair, Zap, Skull, Shield, Activity, Package, AlertTriangle } from 'lucide-react';
import ArmorGridItem from './ArmorGridItem';
import StandardGridItem from './StandardGridItem';
import SteamButton from '../ui/SteamButton';

const icons = {
    primary: <Crosshair size={14} />,
    secondary: <Zap size={14} />,
    grenade: <Skull size={14} />,
    armor: <Shield size={14} />,
    booster: <Activity size={14} />,
    stratagems: <Package size={14} />
};

export default function PoolGrid({ category, poolSection }) {
    const { uid } = useGameStore();
    const { claimItem, unclaimItem } = useDraft();
    const [hasHover, setHasHover] = useState(true);
    const [activeTooltipId, setActiveTooltipId] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const [showDebugNames, setShowDebugNames] = useState(() => localStorage.getItem('hd2_debug_names') === 'true');

    const toggleDebugNames = () => {
        const next = !showDebugNames;
        setShowDebugNames(next);
        localStorage.setItem('hd2_debug_names', next ? 'true' : 'false');
    };

    useEffect(() => {
        setHasHover(window.matchMedia('(hover: hover)').matches);
        
        const handleClickOutside = () => {
            if (!hasHover) setActiveTooltipId(null);
        };
        
        if (!hasHover) {
            document.addEventListener('touchstart', handleClickOutside);
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [hasHover]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    };

    if (!poolSection) return null;

    const items = Object.values(poolSection);
    const userWarbonds = RulesEngine.getUserWarbonds();

    // Сортировка: сначала доступные, затем занятые, затем по алфавиту
    items.sort((a, b) => {
        if (a.claimedBy && !b.claimedBy) return 1;
        if (!a.claimedBy && b.claimedBy) return -1;
        return a.name.localeCompare(b.name);
    });

    const handleItemClick = (e, item) => {
        if (!hasHover) {
            e.stopPropagation();
            if (activeTooltipId === item.id) {
                performAction(item);
                setActiveTooltipId(null);
            } else {
                setActiveTooltipId(item.id);
            }
        } else {
            performAction(item);
        }
    };
    
    const performAction = async (item) => {
        if (!item.claimedBy) {
            const res = await claimItem(category, item.id);
            if (res && !res.success && res.reason) {
                showToast(RulesEngine.getErrorMessage(res.reason));
            }
        } else if (item.claimedBy === uid) {
            unclaimItem(category, item.id);
        }
    };

    return (
        <div className="bg-hcDark border border-hcBorder p-3 sm:p-4 rounded-lg relative">
            {toastMessage && (
                <div className="absolute top-2 right-2 z-[100] bg-red-950/90 border border-red-500 text-red-200 px-3 py-2 rounded shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 text-xs sm:text-sm font-bold uppercase tracking-wider">
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            <div className="flex items-center justify-between border-b border-[var(--steam-border-dark)] pb-1.5 mb-2.5">
                <span className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wider">
                    АРСЕНАЛ // <span className="text-hcAccent">{category.toUpperCase()}</span>
                </span>
                <SteamButton
                    variant="tab"
                    onClick={toggleDebugNames}
                    className={`px-2 py-0.5 text-[9px] font-mono font-bold transition-colors ${showDebugNames ? 'active text-hcGreen' : 'text-gray-400 opacity-70 hover:opacity-100'}`}
                    title="Переключить отображение технических имен и файлов для отладки"
                >
                    DEV NAMES: {showDebugNames ? 'ON' : 'OFF'}
                </SteamButton>
            </div>
            
            {category === 'armor' ? (
                <div className={`grid ${getGridCols(category)}`}>
                    {items.map(item => (
                        <ArmorGridItem
                            key={item.id}
                            item={item}
                            status={getItemStatus(item, uid, userWarbonds)}
                            showDebugNames={showDebugNames}
                            hasHover={hasHover}
                            showTooltip={!hasHover && activeTooltipId === item.id}
                            onItemClick={handleItemClick}
                            onPerformAction={performAction}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {groupItemsBySubcategory(items, category).map(([subTitle, subItems], subIdx) => (
                        <div key={subIdx} className="flex flex-col gap-2">
                            {subTitle && (
                                <div className="text-[11px] font-bold text-hcMuted uppercase tracking-wider border-b border-hcBorder/40 pb-1 pt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-hcAccent rounded-full inline-block"></span>
                                    {subTitle}
                                </div>
                            )}
                            <div className={`grid ${getGridCols(category)}`}>
                                {subItems.map(item => (
                                    <StandardGridItem
                                        key={item.id}
                                        item={item}
                                        category={category}
                                        status={getItemStatus(item, uid, userWarbonds)}
                                        showDebugNames={showDebugNames}
                                        hasHover={hasHover}
                                        showTooltip={!hasHover && activeTooltipId === item.id}
                                        onItemClick={handleItemClick}
                                        onPerformAction={performAction}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

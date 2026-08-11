import { useCallback } from 'react';
import { db } from '../utils/firebase';
import { ref, runTransaction, get } from 'firebase/database';
import useGameStore from '../store/useGameStore';
import { getDefaultWarbonds } from '../utils/warbondRegistry';

const isExosuit = (item) => {
    if (!item) return false;
    return item.slotType === 'Vehicle' || item.tags?.includes('exosuit') || item.id?.includes('exosuit');
};

const getMyOwnedWarbonds = () => {
    try {
        const saved = localStorage.getItem('bingo_owned_warbonds');
        return saved ? JSON.parse(saved) : getDefaultWarbonds();
    } catch (e) {
        return getDefaultWarbonds();
    }
};

export function useDraft() {
    const { roomCode, uid } = useGameStore();

    const claimItem = useCallback(async (category, itemId) => {
        if (!roomCode || !uid) return { success: false };
        
        // 1. Проверяем, не взял ли этот игрок УЖЕ предмет этой категории
        const categoryRef = ref(db, `rooms/${roomCode}/pool/${category}`);
        const snapshot = await get(categoryRef);
        
        if (snapshot.exists()) {
            const items = snapshot.val();
            const targetItem = items[itemId];

            if (targetItem) {
                // === EXCLUSIVE LOOT CHECK (PHASE 3) ===
                if (targetItem.exclusiveTo && targetItem.exclusiveTo !== uid) {
                    return { success: false, reason: 'EXCLUSIVE_LOOT' };
                }

                // === WARBOND OWNERSHIP CHECK ===
                const code = targetItem.warbondCode || targetItem.code;
                const isFree = !code || code === 'none' || targetItem.isBase;
                if (!isFree) {
                    const myWarbonds = getMyOwnedWarbonds();
                    const ownsIt = myWarbonds.includes(code) || myWarbonds.includes(targetItem.id);
                    if (!ownsIt) {
                        return { success: false, reason: 'WARBOND_NOT_OWNED' };
                    }
                }
            }

            // Логика лимитов: 
            // Для стратагем лимит = 4, для всего остального = 1.
            let myClaimedCount = 0;
            let itemToDrop = null;
            let hasExosuit = false;

            const targetIsExosuit = isExosuit(targetItem);
            
            for (const [key, itemData] of Object.entries(items)) {
                // Защита от null объектов
                if (itemData && itemData.claimedBy === uid) {
                    myClaimedCount++;
                    if (category !== 'stratagems') {
                        itemToDrop = key; // Запоминаем старый предмет 
                    }
                    if (category === 'stratagems' && isExosuit(itemData) && key !== itemId) {
                        hasExosuit = true;
                    }
                }
            }

            // Ограничение: Нельзя иметь более 1 Экзоскелета/Vehicle в билде
            if (category === 'stratagems' && targetIsExosuit && hasExosuit) {
                return { success: false, reason: 'EXOSUIT_LIMIT' };
            }

            // Если это стратагемы и мы уже набрали 4 - запрещаем брать пятую кликом
            if (category === 'stratagems' && myClaimedCount >= 4) {
                 return { success: false, reason: 'SLOT_LIMIT' };
            }
            
            // Если это НЕ стратагемы (оружие, броня), и предмет уже есть, мы должны автоматически выкинуть старый
            if (category !== 'stratagems' && itemToDrop) {
                 await runTransaction(ref(db, `rooms/${roomCode}/pool/${category}/${itemToDrop}/claimedBy`), (currentData) => {
                     if (currentData === uid) return null;
                     return;
                 });
            }
        }

        // 2. Берем новый предмет
        const itemRef = ref(db, `rooms/${roomCode}/pool/${category}/${itemId}/claimedBy`);
        try {
            const result = await runTransaction(itemRef, (currentData) => {
                if (currentData === null) {
                    return uid; // Забираем 
                }
                return;
            });

            return { success: result.committed };
        } catch (e) {
            console.error("Claim error:", e);
            return { success: false };
        }
    }, [roomCode, uid]);

    const unclaimItem = useCallback(async (category, itemId) => {
        if (!roomCode || !uid) return;
        const itemRef = ref(db, `rooms/${roomCode}/pool/${category}/${itemId}/claimedBy`);
        
        try {
            await runTransaction(itemRef, (currentData) => {
                if (currentData === uid) {
                    return null; 
                }
                return; 
            });
        } catch (e) {
            console.error("Unclaim error:", e);
        }
    }, [roomCode, uid]);

    return { claimItem, unclaimItem };
}
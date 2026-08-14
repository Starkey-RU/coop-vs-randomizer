import { useCallback } from 'react';
import { db } from '../utils/firebase';
import { ref, runTransaction, get } from 'firebase/database';
import useGameStore from '../store/useGameStore';
import RulesEngine from '../utils/RulesEngine';

export function useDraft() {
    const { roomCode, uid } = useGameStore();

    const claimItem = useCallback(async (category, itemId) => {
        if (!roomCode || !uid) return { success: false };
        
        // 1. Проверяем правила и ограничения через RulesEngine
        const categoryRef = ref(db, `rooms/${roomCode}/pool/${category}`);
        const snapshot = await get(categoryRef);
        
        if (snapshot.exists()) {
            const items = snapshot.val();
            const targetItem = items[itemId];

            const validation = RulesEngine.validateClaim(category, targetItem, items, uid);
            if (!validation.allowed) {
                return { success: false, reason: validation.reason };
            }

            // Если это одиночный слот (оружие, броня, граната, бустер) и предмет уже экипирован, сбрасываем старый
            if (category !== 'stratagems' && validation.itemToDrop) {
                 await runTransaction(ref(db, `rooms/${roomCode}/pool/${category}/${validation.itemToDrop}/claimedBy`), (currentData) => {
                     if (currentData === uid) return null;
                     return;
                 });
            }
        }

        // 2. Забираем новый предмет атомарной транзакцией
        const itemRef = ref(db, `rooms/${roomCode}/pool/${category}/${itemId}/claimedBy`);
        try {
            const result = await runTransaction(itemRef, (currentData) => {
                if (currentData === null) {
                    return uid; // Забираем 
                }
                return; // Предмет уже кем-то занят
            });

            if (!result.committed) {
                return { success: false, reason: 'ALREADY_TAKEN' };
            }

            return { success: true };
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
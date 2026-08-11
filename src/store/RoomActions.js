import { db } from '../utils/firebase';
import { ref, update } from 'firebase/database';
import RandomizerEngine from '../RandomizerEngine';
import databaseObj from '../../database.json';

const lootEngine = new RandomizerEngine(databaseObj);

class RoomActions {
    static async toggleReadyStatus(roomCode, uidsToUpdate, isReady) {
        if (!roomCode) return;
        const updates = {};
        if (Array.isArray(uidsToUpdate)) {
            uidsToUpdate.forEach(id => {
                updates[`rooms/${roomCode}/players/${id}/isReady`] = isReady;
            });
        } else {
            updates[`rooms/${roomCode}/players/${uidsToUpdate}/isReady`] = isReady;
        }
        await update(ref(db), updates);
    }

    static async updateRoomOption(roomCode, optionKey, value) {
        if (!roomCode) return;
        const updates = {
            [`rooms/${roomCode}/options/${optionKey}`]: value
        };
        await update(ref(db), updates);
    }

    static async kickPlayer(roomCode, kickUid, currentPool) {
        if (!roomCode || !kickUid) return;
        
        const updates = {};
        updates[`rooms/${roomCode}/players/${kickUid}`] = null; // Remove player record

        // Return their claimed gear back to the pool
        if (currentPool) {
            ['primary', 'secondary', 'grenade', 'armor', 'booster', 'stratagems'].forEach(category => {
                if (currentPool[category]) {
                    Object.keys(currentPool[category]).forEach(itemId => {
                        const item = currentPool[category][itemId];
                        if (item.claimedBy === kickUid) {
                            updates[`rooms/${roomCode}/pool/${category}/${itemId}/claimedBy`] = null;
                            
                            // If this was exclusive loot generated just for them, unlock it for others
                            if (item.exclusiveTo === kickUid) {
                                updates[`rooms/${roomCode}/pool/${category}/${itemId}/exclusiveTo`] = null;
                            }
                        }
                    });
                }
            });
        }

        await update(ref(db), updates);
    }

    static async injectPersonalLoot(roomCode, targetUid, currentPool) {
        if (!roomCode || !targetUid || !currentPool) return;
        
        // Check if we already generated drop-in loot for this player
        let hasExclusiveInfo = false;
        if (currentPool.primary) {
            hasExclusiveInfo = Object.values(currentPool.primary).some(i => i.exclusiveTo === targetUid);
        }
        if (hasExclusiveInfo) return;

        console.log(`[GameOrchestrator] Injecting personal locked loot for Drop-in player UID: ${targetUid}`);

        const updates = {};
        lootEngine.reset(); // Make sure randomizer is fresh
        
        const loadouts = lootEngine.generateLobbyRolls(1);
        if (!loadouts || !loadouts[0]) return;
        const pLoot = loadouts[0];

        const inject = (category, itemArr) => {
            if (!itemArr || itemArr.length === 0) return;
            itemArr.forEach(item => {
                const uniqId = `${item.id}_dropin_${targetUid}`;
                updates[`rooms/${roomCode}/pool/${category}/${uniqId}`] = {
                    ...item,
                    baseId: item.id,
                    id: uniqId,
                    claimedBy: null,
                    exclusiveTo: targetUid // The lock flag => only they can claim it in useDraft
                };
            });
        };

        if (pLoot.primary) inject('primary', [pLoot.primary]);
        if (pLoot.secondary) inject('secondary', [pLoot.secondary]);
        if (pLoot.grenade) inject('grenade', [pLoot.grenade]);
        if (pLoot.armor) inject('armor', [pLoot.armor]);
        
        // Stratagems
        if (pLoot.stratagems) inject('stratagems', pLoot.stratagems);

        if (Object.keys(updates).length > 0) {
             await update(ref(db), updates);
        }
    }
}

export default RoomActions;

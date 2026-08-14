import { db } from '../utils/firebase';
import { ref, update } from 'firebase/database';
import RandomizerEngine from '../RandomizerEngine';
import databaseObj from '../../database.json';
import { initPoolForFirebase, initRandomPoolMode, buildDeployUpdates, buildHistorySnapshot } from '../utils/poolHelpers';

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

    static async updateRoomName(roomCode, newName) {
        if (!roomCode || !newName?.trim()) return;
        await update(ref(db, `rooms/${roomCode}`), {
            roomName: newName.trim()
        });
    }

    static async startDraft(roomCode, players) {
        if (!roomCode || !players) return;
        const warbondsLists = Object.values(players).map(p => p?.warbonds || []);
        const newPool = initPoolForFirebase(databaseObj, warbondsLists);

        await update(ref(db, `rooms/${roomCode}`), {
            pool: newPool
        });
    }

    static async deployCoopDraft(roomCode, pool, roomOptions, players, history) {
        if (!roomCode || !pool) return;
        const uids = Object.keys(players || {});
        const currentMissionCount = Object.keys(history || {}).length + 1;
        const squadSnapshot = buildHistorySnapshot(pool, players);

        const updates = buildDeployUpdates(pool, roomCode, roomOptions, uids);
        updates[`rooms/${roomCode}/history/mission_${currentMissionCount}`] = {
            timestamp: Date.now(),
            missionNumber: currentMissionCount,
            squadLoadouts: squadSnapshot
        };
        updates[`rooms/${roomCode}/options/historyLength`] = currentMissionCount;

        await update(ref(db), updates);
    }

    static async deployRandomPool(roomCode, pool, players, settings) {
        if (!roomCode || !pool) return;
        const uids = Object.keys(players || {});
        const updates = {};
        const categories = ['primary', 'secondary', 'grenade', 'armor', 'booster', 'stratagems'];

        // In Random Pool, deployed equipment is consumed
        categories.forEach(category => {
            if (!pool[category]) return;
            Object.entries(pool[category]).forEach(([itemKey, itemState]) => {
                if (itemState && itemState.claimedBy) {
                    updates[`rooms/${roomCode}/pool/${category}/${itemKey}`] = null;
                }
            });
        });

        // Reset readiness
        uids.forEach(id => {
            updates[`rooms/${roomCode}/players/${id}/isReady`] = false;
        });

        const nextMission = (settings?.currentMission || 1) + 1;
        updates[`rooms/${roomCode}/modeSettings/currentMission`] = nextMission;

        await update(ref(db), updates);
    }

    static async rebuildRandomPool(roomCode, players, configPlayers, configMissions) {
        if (!roomCode || !players) return;
        const warbondsLists = Object.values(players).map(p => p?.warbonds || []);
        const rpData = initRandomPoolMode(databaseObj, warbondsLists, configPlayers, configMissions);

        await update(ref(db, `rooms/${roomCode}`), {
            pool: rpData.pool,
            modeSettings: rpData.modeSettings
        });
    }

    static async rollChaos(roomCode, mode, playersArr, history, engine) {
        if (!roomCode || !playersArr || !engine) return;

        if (mode === 'chaos_random') {
            engine.reset(playersArr);
        } else if (!engine.playerProfiles) {
            engine.reset(playersArr);
        }

        const result = engine.roll(playersArr);
        const newStatus = engine.getPoolStatus();
        const currentMissionCount = Object.keys(history || {}).length + 1;
        const uids = playersArr.map(p => p.uid);

        const updates = {};
        updates[`rooms/${roomCode}/currentRoll`] = result;
        updates[`rooms/${roomCode}/poolState`] = newStatus;

        uids.forEach(id => {
            updates[`rooms/${roomCode}/players/${id}/isReady`] = false;
        });

        updates[`rooms/${roomCode}/history/mission_${currentMissionCount}`] = {
            timestamp: Date.now(),
            missionNumber: currentMissionCount,
            roll: result
        };

        await update(ref(db), updates);
    }

    static async returnToLobby(roomCode, uids) {
        if (!roomCode) return;
        const updates = {};
        updates[`rooms/${roomCode}/currentRoll`] = null;

        if (Array.isArray(uids)) {
            uids.forEach(id => {
                updates[`rooms/${roomCode}/players/${id}/isReady`] = false;
            });
        }

        await update(ref(db), updates);
    }

    static async resetChaosPool(roomCode, playersArr, engine) {
        if (!roomCode || !engine) return;
        engine.reset(playersArr);

        await update(ref(db, `rooms/${roomCode}`), {
            currentRoll: null,
            poolState: engine.getPoolStatus()
        });
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
                        if (item && item.claimedBy === kickUid) {
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

    static async injectPersonalLoot(roomCode, targetUid, currentPool, targetWarbonds = []) {
        if (!roomCode || !targetUid || !currentPool) return;

        // Check if we already generated drop-in loot for this player
        let hasExclusiveInfo = false;
        if (currentPool.primary) {
            hasExclusiveInfo = Object.values(currentPool.primary).some(i => i && i.exclusiveTo === targetUid);
        }
        if (hasExclusiveInfo) return;

        console.log(`[RoomActions] Injecting personal locked loot for Drop-in player UID: ${targetUid}`);

        const updates = {};
        lootEngine.reset([{ uid: targetUid, warbonds: targetWarbonds }]);

        const rollResult = lootEngine.roll([{ uid: targetUid, warbonds: targetWarbonds }]);
        if (!rollResult || !rollResult.builds || !rollResult.builds[0]) return;
        const pLoot = rollResult.builds[0];

        const inject = (category, itemArr) => {
            if (!itemArr || itemArr.length === 0) return;
            itemArr.forEach(item => {
                if (!item) return;
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

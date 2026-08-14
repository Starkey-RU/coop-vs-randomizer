import { create } from 'zustand';
import { db } from '../utils/firebase';
import { ref, set, onValue, update, get, child, remove, onDisconnect } from 'firebase/database';
import { initPoolForFirebase, initRandomPoolMode } from '../utils/poolHelpers';
import { getDefaultWarbonds } from '../utils/warbondRegistry';
import databaseObj from '../../database.json';

const getLocalUid = () => {
    let uid = localStorage.getItem('hd2_uid');
    if (!uid) {
        uid = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem('hd2_uid', uid);
    }
    return uid;
};

const getLocalWarbonds = () => {
    try {
        const saved = localStorage.getItem('bingo_owned_warbonds');
        return saved ? JSON.parse(saved) : getDefaultWarbonds();
    } catch (e) {
        return getDefaultWarbonds();
    }
};

const useGameStore = create((setStore, getStore) => ({
    uid: getLocalUid(),
    name: localStorage.getItem('hd2_name') || 'Helldiver',
    roomCode: null,
    isHost: false,
    roomData: null,
    activeRooms: [],
    _roomUnsub: null,

    setName: (newName) => {
        localStorage.setItem('hd2_name', newName);
        setStore({ name: newName });
        
        const { roomCode, uid } = getStore();
        if (roomCode) {
            update(ref(db, `rooms/${roomCode}/players/${uid}`), { name: newName });
        }
    },

    syncWarbonds: async () => {
        const { roomCode, uid } = getStore();
        if (!roomCode) return;
        
        const myWarbonds = getLocalWarbonds();
        await update(ref(db, `rooms/${roomCode}/players/${uid}`), { 
            warbonds: myWarbonds 
        });
    },

    listenToActiveRooms: () => {
        const roomsRef = ref(db, 'rooms');
        onValue(roomsRef, (snapshot) => {
            const rooms = [];
            const now = Date.now();
            const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
            const updates = {};

            snapshot.forEach((childSnap) => {
                const data = childSnap.val();
                if (!data) return;
                
                // GC Logic: Mark for deletion if older than 5 days
                if (data.createdAt && (now - data.createdAt > FIVE_DAYS_MS)) {
                    updates[`rooms/${childSnap.key}`] = null; // null deletes the key in Firebase
                    return;
                }

                // If GC didn't kill it and it's missing createdAt, stamp it now (retroactive fix)
                if (!data.createdAt) {
                    updates[`rooms/${childSnap.key}/createdAt`] = now;
                }

                if (data.status === 'lobby') {
                    rooms.push({ id: childSnap.key, ...data });
                }
            });

            // Execute batch GC / retro-stamps to avoid Maximum call stack size exceeded
            if (Object.keys(updates).length > 0) {
                 update(ref(db), updates);
            }

            setStore({ activeRooms: rooms });
        });
    },

    createRoom: async (mode, customRoomName = '') => {
        const { uid, name } = getStore();
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        const myLocalWarbonds = getLocalWarbonds();
        const finalRoomName = customRoomName.trim() || `Операция ${name}`;
        
        let initialRoom = {
            host: uid,
            mode: mode, 
            roomName: finalRoomName,
            status: 'lobby',
            createdAt: Date.now(),
            players: {
                [uid]: { 
                    name, 
                    isReady: false,
                    warbonds: myLocalWarbonds,
                    online: true,
                    leftAt: null
                }
            },
            pool: null,
            poolState: null,
            currentRoll: null
        };

        try {
            await set(ref(db, `rooms/${code}`), initialRoom);
            onDisconnect(ref(db, `rooms/${code}/players/${uid}/online`)).set(false);
            setStore({ roomCode: code, isHost: true });
            getStore().listenRoom(code);
            return code;
        } catch (error) {
            console.error("Firebase Create Room Error:", error);
            throw error;
        }
    },

    joinRoom: async (code) => {
        const { uid, name, roomCode: currentRoom } = getStore();
        const codeUpper = code.toUpperCase();
        
        if (currentRoom === codeUpper && getStore().roomData) return;

        const snapshot = await get(child(ref(db), `rooms/${codeUpper}`));
        if (!snapshot.exists()) {
            throw new Error("Room not found");
        }

        const roomData = snapshot.val();
        const existingPlayer = roomData.players?.[uid];

        await update(ref(db, `rooms/${codeUpper}/players/${uid}`), {
            name: name || existingPlayer?.name || 'Helldiver',
            isReady: existingPlayer ? (existingPlayer.isReady || false) : false,
            warbonds: existingPlayer?.warbonds || getLocalWarbonds(),
            online: true,
            leftAt: null
        });

        onDisconnect(ref(db, `rooms/${codeUpper}/players/${uid}/online`)).set(false);

        const isHost = roomData.host === uid;
        setStore({ roomCode: codeUpper, isHost });
        getStore().listenRoom(codeUpper);
    },

    leaveRoom: () => {
        const { roomCode, uid, _roomUnsub } = getStore();
        if (_roomUnsub) {
            _roomUnsub();
        }
        if (roomCode) {
            update(ref(db, `rooms/${roomCode}/players/${uid}`), {
                online: false,
                leftAt: Date.now()
            });
        }
        setStore({ roomCode: null, isHost: false, roomData: null, _roomUnsub: null });
    },

    listenRoom: (code) => {
        const currentUnsub = getStore()._roomUnsub;
        if (currentUnsub) {
            currentUnsub();
        }

        const roomRef = ref(db, `rooms/${code}`);
        const unsub = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setStore({ roomData: data });
                if (data.host === getStore().uid) {
                    setStore({ isHost: true });
                } else {
                    setStore({ isHost: false });
                }
            } else {
                setStore({ roomCode: null, roomData: null, isHost: false });
            }
        });

        setStore({ _roomUnsub: unsub });
    }
}));

export default useGameStore;
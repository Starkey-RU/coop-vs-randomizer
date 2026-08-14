import { db } from '../utils/firebase';
import { ref, remove, update } from 'firebase/database';

/**
 * AdminActions - Централизованный сервис для административных действий с комнатами и базой
 */
export const AdminActions = {
    /**
     * Удаляет конкретную комнату по коду
     */
    async deleteRoom(code) {
        if (!code) return;
        await remove(ref(db, `rooms/${code}`));
    },

    /**
     * Очищает ВСЕ комнаты из базы данных
     */
    async clearAllRooms() {
        await remove(ref(db, 'rooms'));
    },

    /**
     * Запускает сборку мусора (GC) для комнат старше 5 дней
     */
    async runGarbageCollector(rooms) {
        const now = Date.now();
        const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
        const updates = {};
        let count = 0;

        rooms.forEach(room => {
            if (room.createdAt && (now - room.createdAt > FIVE_DAYS_MS)) {
                updates[`rooms/${room.code}`] = null;
                count++;
            }
        });

        if (count > 0) {
            await update(ref(db), updates);
        }

        return count;
    }
};

export default AdminActions;

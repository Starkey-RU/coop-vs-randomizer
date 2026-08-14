import { getDefaultWarbonds } from './warbondRegistry';

/**
 * RulesEngine - Централизованный движок правил экипировки и валидации драфта
 */
export const RulesEngine = {
    /**
     * Проверяет, является ли предмет экзоскелетом / тяжелой техникой
     */
    isExosuit(item) {
        if (!item) return false;
        return item.slotType === 'Vehicle' || 
               item.tags?.includes('exosuit') || 
               item.id?.includes('exosuit');
    },

    /**
     * Получает список варбондов текущего пользователя из localStorage
     */
    getUserWarbonds() {
        try {
            const saved = localStorage.getItem('bingo_owned_warbonds');
            return saved ? JSON.parse(saved) : getDefaultWarbonds();
        } catch (e) {
            return getDefaultWarbonds();
        }
    },

    /**
     * Проверяет, доступен ли предмет игроку по лицензиям варбондов
     */
    hasWarbondOwnership(item, userWarbonds = null) {
        if (!item) return true;
        const code = item.warbondCode || item.code;
        const isFree = !code || code === 'none' || item.isBase;
        if (isFree) return true;

        const warbonds = userWarbonds || this.getUserWarbonds();
        return warbonds.includes(code) || warbonds.includes(item.id);
    },

    /**
     * Проверяет, является ли предмет частью Superstore
     */
    isSuperstore(item) {
        if (!item) return false;
        return item.warbondCode === 'superstore' || item.tags?.includes('Superstore');
    },

    /**
     * Валидирует возможность взятия предмета игроком
     * @param {string} category - категория ('primary', 'secondary', 'grenade', 'armor', 'booster', 'stratagems')
     * @param {object} targetItem - объект предмета
     * @param {object} categoryPool - весь пул данной категории из комнаты
     * @param {string} playerUid - UID текущего игрока
     * @param {Array} userWarbonds - список открытых варбондов
     * @returns {{ allowed: boolean, reason?: string, itemToDrop?: string }}
     */
    validateClaim(category, targetItem, categoryPool = {}, playerUid, userWarbonds = null) {
        if (!targetItem) {
            return { allowed: false, reason: 'ITEM_NOT_FOUND' };
        }

        // 1. Проверка эксклюзивного лута (Drop-in механика)
        if (targetItem.exclusiveTo && targetItem.exclusiveTo !== playerUid) {
            return { allowed: false, reason: 'EXCLUSIVE_LOOT' };
        }

        // 2. Проверка владения варбондом
        if (!this.hasWarbondOwnership(targetItem, userWarbonds)) {
            return { allowed: false, reason: 'WARBOND_NOT_OWNED' };
        }

        // 3. Анализ текущего билда в этой категории
        let myClaimedCount = 0;
        let itemToDrop = null;
        let hasExosuit = false;
        const targetIsExosuit = this.isExosuit(targetItem);

        for (const [key, itemData] of Object.entries(categoryPool)) {
            if (itemData && itemData.claimedBy === playerUid) {
                myClaimedCount++;
                if (category !== 'stratagems') {
                    itemToDrop = key; // Для одиночных слотов запоминаем предмет для авто-сброса
                }
                if (category === 'stratagems' && this.isExosuit(itemData) && key !== targetItem.id) {
                    hasExosuit = true;
                }
            }
        }

        // 4. Ограничение: максимум 1 экзоскелет
        if (category === 'stratagems' && targetIsExosuit && hasExosuit) {
            return { allowed: false, reason: 'EXOSUIT_LIMIT' };
        }

        // 5. Ограничение: максимум 4 стратагемы
        if (category === 'stratagems' && myClaimedCount >= 4) {
            return { allowed: false, reason: 'SLOT_LIMIT' };
        }

        return { allowed: true, itemToDrop };
    },

    /**
     * Возвращает понятное пользователю сообщение об ошибке
     */
    getErrorMessage(reason) {
        switch (reason) {
            case 'EXOSUIT_LIMIT':
                return 'Максимум 1 Экзоскелет / Техника на бойца!';
            case 'WARBOND_NOT_OWNED':
                return 'У вас нет личной лицензии на этот Warbond!';
            case 'SLOT_LIMIT':
                return 'Максимум 4 стратагемы в билде!';
            case 'EXCLUSIVE_LOOT':
                return 'Этот предмет зарезервирован для другого бойца!';
            case 'ALREADY_TAKEN':
                return 'Предмет уже занят другим игроком!';
            default:
                return 'Не удалось взять предмет!';
        }
    }
};

export default RulesEngine;

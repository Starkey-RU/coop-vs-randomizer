import { shuffle, randomInt } from './utils/random';

const isExosuitItem = (s) => {
    if (!s) return false;
    return s.slotType === 'Vehicle' || s.tags?.includes('exosuit') || s.id?.includes('exosuit');
};

class StratagemManager {
    constructor(stratagemsDatabase, rng = Math.random) {
        // Клонируем массив, чтобы не мутировать базу
        this.pool = [...stratagemsDatabase];
        this.rng = rng;
    }

    pickForPlayer(count = 4, allowedWarbonds = null) {
        // Фильтруем пул по варбондам игрока, если они переданы
        let availablePool = this.pool;
        if (allowedWarbonds && Array.isArray(allowedWarbonds)) {
            availablePool = this.pool.filter(item => {
                const code = item.warbondCode || item.code;
                if (!code || code === 'none' || item.isBase) return true;
                return allowedWarbonds.includes(code) || allowedWarbonds.includes(item.id);
            });
        }

        // Делим стратагемы на категории
        const backpackIds = ['Backpack', 'Weapon+Backpack'];
        const backpacks = availablePool.filter(s => backpackIds.includes(s.slotType));
        const vehicles = availablePool.filter(s => isExosuitItem(s));
        const free = availablePool.filter(s => !backpackIds.includes(s.slotType) && !isExosuitItem(s));

        let picked = [];
        let remainingCount = count;

        // Логика ОДНОГО РЮКЗАКА
        let useBackpack = false;
        if (backpacks.length > 0) {
             useBackpack = this.rng() > 0.5 || free.length + vehicles.length < remainingCount;
        }

        if (useBackpack) {
            const bpItem = backpacks.splice(randomInt(0, backpacks.length - 1, this.rng), 1)[0];
            picked.push(bpItem);
            remainingCount--;
        }

        // Логика ОДНОГО МЕХА (VEHICLE / EXOSUIT)
        let useVehicle = false;
        if (vehicles.length > 0 && remainingCount > 0) {
             useVehicle = this.rng() > 0.8;
        }

        if (useVehicle && remainingCount > 0) {
            const vehItem = vehicles.splice(randomInt(0, vehicles.length - 1, this.rng), 1)[0];
            picked.push(vehItem);
            remainingCount--;
        }

        // Добираем свободные
        shuffle(free, this.rng);
        while (remainingCount > 0 && free.length > 0) {
            picked.push(free.pop());
            remainingCount--;
        }

        // Удаляем выбранные предмет(ы) из ОБЩЕГО пула, чтобы другой игрок не мог их забрать в том же рейд-раунде
        const pickedIds = picked.map(p => p.id);
        this.pool = this.pool.filter(s => !pickedIds.includes(s.id));

        // Докидываем null, если доступный пул иссяк
        while (picked.length < count) {
            picked.push(null);
        }

        shuffle(picked, this.rng);
        return picked;
    }
}

export default StratagemManager;
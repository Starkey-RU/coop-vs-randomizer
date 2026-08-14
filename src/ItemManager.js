import { randomInt } from './utils/random';

class ItemManager {
    constructor(databaseArray, rng = Math.random) {
        this.pool = [...databaseArray];
        this.rng = rng;
    }

    pick() {
        if (this.pool.length === 0) {
            return null; // Empty pool
        }
        const index = randomInt(0, this.pool.length - 1, this.rng);
        return this.pool.splice(index, 1)[0]; // Remove and return picked item
    }

    pickFromFilteredContext(filteredArray) {
        if (!filteredArray || filteredArray.length === 0) {
            return null;
        }

        // Выбираем из отфильтрованного массива (локального)
        const localIndex = randomInt(0, filteredArray.length - 1, this.rng);
        const selectedItem = filteredArray[localIndex];

        // Теперь нам надо удалить его из НАШЕГО глобального pool, чтобы он не выпал дважды
        const globalIndex = this.pool.findIndex(i => i.name === selectedItem.name); // предполагаю что name или id уникальные. Пусть будет name для надежности (или object reference если без сериализации).
        if (globalIndex !== -1) {
            this.pool.splice(globalIndex, 1);
        }

        return selectedItem;
    }
}

export default ItemManager;
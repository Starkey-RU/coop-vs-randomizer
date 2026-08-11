import { shuffle, randomInt } from './utils/random';

class BoosterManager {
    constructor(boosterDatabase, rng = Math.random) {
        this.rng = rng;
        // Must-have бустеры, которые мы обрабатываем отдельно
        // Только Оптимизация (патроны) выдается всегда
        this.mustHavesIds = ['hellpodspaceoptimization'];
        
        // Разделяем базу на обязательные и обычные бустеры
        this.mustHaves = boosterDatabase.filter(b => this.mustHavesIds.includes(b.id));
        this.normalPool = boosterDatabase.filter(b => !this.mustHavesIds.includes(b.id));
        
        // Очередь FIFO для кулдауна (здесь хранятся массивы использованных бустеров по миссиям)
        this.usedHistory = []; 
    }

    pickForTeam(playerCount) {
        let teamBoosters = [];
        let currentRollUsed = []; // Бустеры, которые истратятся в этом ролле
        
        // 1. Обязательно даем Оптимизацию (Hellpod Space Optimization)
        const optimization = this.mustHaves.find(b => b.id === 'hellpodspaceoptimization');
        if (optimization) {
            teamBoosters.push(optimization);
        }

        // 2. С некоторым шансом (или всегда) докидываем Vitality или Stamina
        // Для примера - берем 1 случайный из оставшихся must-haves
        const otherMustHaves = this.mustHaves.filter(b => b.id !== 'hellpodspaceoptimization');
        if (otherMustHaves.length > 0 && teamBoosters.length < playerCount) {
            shuffle(otherMustHaves, this.rng);
            teamBoosters.push(otherMustHaves[0]);
        }

        // 3. Добираем остальные из нормального пула
        while (teamBoosters.length < playerCount) {
            // Если нормальный пул опустел, ВОЗВРАЩАЕМ старые (FIFO)
            if (this.normalPool.length === 0) {
                if (this.usedHistory.length > 0) {
                    // Достаем самые первые использованные бустеры из очереди
                    const recoveredPack = this.usedHistory.shift(); 
                    this.normalPool.push(...recoveredPack);
                } else {
                    // Если даже в истории пусто (что вряд ли), прерываем цикл
                    teamBoosters.push(null);
                    continue;
                }
            }

            // Берем случайный бустер из нормального пула
            const randIndex = randomInt(0, this.normalPool.length - 1, this.rng);
            const picked = this.normalPool.splice(randIndex, 1)[0];
            teamBoosters.push(picked);
            currentRollUsed.push(picked);
        }

        // 4. Записываем использованные обычные бустеры в историю для кулдауна
        if (currentRollUsed.length > 0) {
            this.usedHistory.push(currentRollUsed);
        }

        // 5. Перемешиваем, чтобы Оптимизация не всегда падала Игроку №1
        shuffle(teamBoosters, this.rng);

        return teamBoosters;
    }
}

export default BoosterManager;
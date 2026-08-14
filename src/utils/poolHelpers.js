import { shuffle } from './random';

export const UNDEPLETABLE_BOOSTER_IDS = new Set([
    'hellpodspaceoptimization',
    'spaceoptimization',
    'vitality',
    'vitalityenhancement'
]);

export function arrayToHashmap(arr) {
    const map = {};
    arr.forEach(item => {
        map[item.id] = { ...item, claimedBy: null };
    });
    return map;
}

export function filterPoolByWarbonds(poolArray, allowedWarbondsUnion = []) {
    return poolArray.filter(item => {
        const code = item.warbondCode || item.code;
        // Базовые предметы без кода DLC или с кодом 'none' всегда доступны
        if (!code || code === 'none' || item.isBase) return true;
        // Предмет доступен, если союз варбондов содержит его код или ID предмета (для Superstore)
        return allowedWarbondsUnion.includes(code) || allowedWarbondsUnion.includes(item.id);
    });
}

// playerWarbondsList = массив массивов лицензий, например: [ ["warbond1", "warbond3"], ["warbond9"] ]
export function initPoolForFirebase(database, playerWarbondsList = []) {
    // В Модели 3 (Draft) комната объединяет ВСЕ варбонды ее участников в один "Командный пул" для выбора
    const allAllowedWarbonds = new Set();
    playerWarbondsList.forEach(playerBonds => {
        if (Array.isArray(playerBonds)) {
            playerBonds.forEach(wb => allAllowedWarbonds.add(wb));
        }
    });
    const teamUnion = Array.from(allAllowedWarbonds);

    return {
        primary: arrayToHashmap(filterPoolByWarbonds(database.primary, teamUnion)),
        secondary: arrayToHashmap(filterPoolByWarbonds(database.secondary, teamUnion)),
        grenade: arrayToHashmap(filterPoolByWarbonds(database.grenade, teamUnion)),
        armor: arrayToHashmap(filterPoolByWarbonds(database.armor, teamUnion)),
        booster: arrayToHashmap(filterPoolByWarbonds(database.booster, teamUnion)),
        stratagems: arrayToHashmap(filterPoolByWarbonds(database.stratagems, teamUnion))
    };
}

// Генерация пула для режима Random Pool (Ограниченный пул на X игроков и Y миссий)
export function initRandomPoolMode(database, playerWarbondsList = [], playerCount = 4, missionCount = 3) {
    // Сначала фильтруем глобальный пул по варбондам команды
    const allAllowedWarbonds = new Set();
    playerWarbondsList.forEach(playerBonds => {
        if (Array.isArray(playerBonds)) {
            playerBonds.forEach(wb => allAllowedWarbonds.add(wb));
        }
    });
    const teamUnion = Array.from(allAllowedWarbonds);

    const filteredDB = {
        primary: filterPoolByWarbonds(database.primary, teamUnion),
        secondary: filterPoolByWarbonds(database.secondary, teamUnion),
        grenade: filterPoolByWarbonds(database.grenade, teamUnion),
        armor: filterPoolByWarbonds(database.armor, teamUnion),
        booster: filterPoolByWarbonds(database.booster, teamUnion),
        stratagems: filterPoolByWarbonds(database.stratagems, teamUnion)
    };

    // Вычисляем квоты (формула: количество игроков * количество миссий)
    const factor = playerCount * missionCount;
    // Стратагем нужно Х4, так как каждый игрок должен иметь по 4 стратагемы на миссию
    const stratagemFactor = factor * 4;

    const pickLimited = (arr, count) => {
        const shuffled = shuffle([...arr]);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    return {
        modeSettings: {
            playerCount,
            missionCount,
            currentMission: 1
        },
        pool: {
            primary: arrayToHashmap(pickLimited(filteredDB.primary, factor)),
            secondary: arrayToHashmap(pickLimited(filteredDB.secondary, factor)),
            grenade: arrayToHashmap(pickLimited(filteredDB.grenade, factor)),
            armor: arrayToHashmap(pickLimited(filteredDB.armor, factor)),
            booster: arrayToHashmap(pickLimited(filteredDB.booster, factor)), // Бустеров может не хватить на всех уникальных, но берем максимум
            stratagems: arrayToHashmap(pickLimited(filteredDB.stratagems, stratagemFactor)) // Х4 стратагем
        }
    };
}

export function getPlayerBuild(pool, playerUid) {
    if (!pool) return { primary: null, secondary: null, grenade: null, armor: null, booster: null, stratagems: [null, null, null, null] };

    const build = {
         primary: Object.values(pool.primary || {}).find(i => i && i.claimedBy === playerUid) || null,
         secondary: Object.values(pool.secondary || {}).find(i => i && i.claimedBy === playerUid) || null,
         grenade: Object.values(pool.grenade || {}).find(i => i && i.claimedBy === playerUid) || null,
         armor: Object.values(pool.armor || {}).find(i => i && i.claimedBy === playerUid) || null,
         booster: Object.values(pool.booster || {}).find(i => i && i.claimedBy === playerUid) || null,
         stratagems: Object.values(pool.stratagems || {}).filter(i => i && i.claimedBy === playerUid)
    };

    while (build.stratagems.length < 4) build.stratagems.push(null);
    return build;
}

export function getFilledCount(pool, playerUid) {
    const build = getPlayerBuild(pool, playerUid);
    const singleCount = [build.primary, build.secondary, build.grenade, build.armor, build.booster].filter(Boolean).length;
    const stratCount = build.stratagems.filter(Boolean).length;
    return singleCount + stratCount;
}

export function getMaxPossibleSlots(pool, playerUid) {
    if (!pool) return 9;
    const build = getPlayerBuild(pool, playerUid);
    
    const isSingleSlotPossible = (category, currentItem) => {
        if (currentItem) return true;
        return Object.values(pool[category] || {}).some(item => item && !item.claimedBy);
    };

    let totalPossible = 0;
    if (isSingleSlotPossible('primary', build.primary)) totalPossible++;
    if (isSingleSlotPossible('secondary', build.secondary)) totalPossible++;
    if (isSingleSlotPossible('grenade', build.grenade)) totalPossible++;
    if (isSingleSlotPossible('armor', build.armor)) totalPossible++;
    if (isSingleSlotPossible('booster', build.booster)) totalPossible++;

    const claimedStrats = build.stratagems.filter(Boolean).length;
    const freeStratsInPool = Object.values(pool.stratagems || {}).filter(item => item && !item.claimedBy).length;
    const possibleStrats = Math.min(4, claimedStrats + freeStratsInPool);
    
    totalPossible += possibleStrats;
    return Math.max(1, totalPossible);
}

export function buildDeployUpdates(pool, roomCode, roomOptions = {}, playerUids = []) {
    const options = {
        depletePrimary: true,
        depleteSecondary: true,
        depleteGrenades: true,
        depleteArmor: true,
        depleteBoosters: false,
        depleteStratagems: true,
        ...roomOptions
    };

    const updates = {};
    const categories = ['primary', 'secondary', 'grenade', 'armor', 'booster', 'stratagems'];

    categories.forEach(category => {
        if (!pool?.[category]) return;

        let shouldDeplete = true;
        if (category === 'primary') {
            shouldDeplete = options.depletePrimary ?? options.depleteWeapons ?? true;
        } else if (category === 'secondary') {
            shouldDeplete = options.depleteSecondary ?? options.depleteWeapons ?? true;
        } else if (category === 'grenade') {
            shouldDeplete = options.depleteGrenades ?? options.depleteWeapons ?? true;
        } else if (category === 'armor') {
            shouldDeplete = options.depleteArmor ?? true;
        } else if (category === 'booster') {
            shouldDeplete = options.depleteBoosters ?? false;
        } else if (category === 'stratagems') {
            shouldDeplete = options.depleteStratagems ?? true;
        }

        Object.entries(pool[category]).forEach(([itemKey, itemState]) => {
            if (itemState && itemState.claimedBy) {
                const isUndepletableBooster = category === 'booster' && (UNDEPLETABLE_BOOSTER_IDS.has(itemState.id) || itemState.isBase);
                if (!shouldDeplete || isUndepletableBooster) {
                    updates[`rooms/${roomCode}/pool/${category}/${itemKey}/claimedBy`] = null;
                } else {
                    updates[`rooms/${roomCode}/pool/${category}/${itemKey}`] = null;
                }
            }
        });
    });

    if (Array.isArray(playerUids)) {
        playerUids.forEach(id => {
            updates[`rooms/${roomCode}/players/${id}/isReady`] = false;
        });
    }

    return updates;
}

export function buildHistorySnapshot(pool, players = {}) {
    const squadLoadouts = {};
    Object.entries(players).forEach(([pUid, pData]) => {
        squadLoadouts[pUid] = {
            name: pData?.name || 'Helldiver',
            build: getPlayerBuild(pool, pUid)
        };
    });
    return squadLoadouts;
}


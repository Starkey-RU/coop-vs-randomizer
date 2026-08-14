import RulesEngine from './RulesEngine';

/**
 * Определяет CSS-классы сетки для категории с учетом пропорций контента
 */
export const getGridCols = (cat) => {
    if (cat === 'primary' || cat === 'secondary') {
        // Оружие горизонтальное (16:9), максимум 6 колонок для комфортного крупного размера
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3';
    }
    if (cat === 'armor') {
        // Броня вертикальная: 8 колонок для FullHD+ и масштабированных экранов
        return 'grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 2xl:grid-cols-8 gap-2 sm:gap-2.5';
    }
    if (cat === 'grenade') {
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2';
    }
    if (cat === 'booster') {
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2';
    }
    if (cat === 'stratagems') {
        return 'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2';
    }
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2';
};

/**
 * Группирует элементы арсенала по подкатегориям для удобного обзора в драфте
 */
export const groupItemsBySubcategory = (itemList, cat) => {
    if (cat === 'primary' || cat === 'secondary') {
        const groups = {
            'Submachine Guns & Pistols': [],
            'Assault Rifles & Marksman': [],
            'Shotguns': [],
            'Energy & Plasma': [],
            'Explosive & Special': [],
            'Other': []
        };

        itemList.forEach(item => {
            const tags = item.tags || [];
            const tagLower = tags.map(t => typeof t === 'string' ? t.toLowerCase() : '');
            
            if (['jar5dominator', 'r36eruptor', 'cb9explodingcrossbow'].includes(item.id) || tagLower.includes('explosive') || tagLower.includes('crossbow')) {
                groups['Explosive & Special'].push(item);
            } else if (tagLower.some(t => ['submachinegun', 'smg', 'pistol', 'sidearm'].includes(t)) || 
                ['smg37defender', 'mp98knight', 'smg72pummeler', 'smg32reprimand', 'sta11smg', 'm7s', 'p40kboltpistol'].includes(item.id)) {
                groups['Submachine Guns & Pistols'].push(item);
            } else if (tagLower.some(t => ['assaultrifle', 'sniper', 'marksmanrifle'].includes(t)) || ['r40khotshot'].includes(item.id)) {
                groups['Assault Rifles & Marksman'].push(item);
            } else if (tagLower.includes('shotgun')) {
                groups['Shotguns'].push(item);
            } else if (tagLower.some(t => ['energy', 'plasma', 'laser', 'arc'].includes(t))) {
                groups['Energy & Plasma'].push(item);
            } else {
                groups['Other'].push(item);
            }
        });

        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }

    if (cat === 'stratagems') {
        const groups = {
            'Offensive Stratagems': [],
            'Defensive Stratagems': [],
            'Utility & Supply': []
        };

        itemList.forEach(item => {
            const tags = (item.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : '');
            const slotType = (item.slotType || '').toLowerCase();
            const name = (item.name || '').toLowerCase();

            const isOffensive = slotType === 'orbital' || slotType === 'eagle' || 
                                tags.includes('orbital') || tags.includes('eagle') || 
                                name.includes('orbital') || name.includes('eagle');
            const isDefensive = ['defensive', 'sentries', 'sentry', 'emplacement'].includes(slotType) || 
                                tags.some(t => ['turret', 'sentry', 'emplacement', 'mine'].includes(t)) || 
                                name.includes('sentry') || name.includes('emplacement') || name.includes('mine');

            if (isOffensive) {
                groups['Offensive Stratagems'].push(item);
            } else if (isDefensive) {
                groups['Defensive Stratagems'].push(item);
            } else {
                groups['Utility & Supply'].push(item);
            }
        });

        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }

    return [['', itemList]];
};

/**
 * Вычисляет состояние доступности предмета для игрока
 */
export const getItemStatus = (item, currentUid, userWarbonds = null) => {
    if (!item) return { isMine: false, isTaken: false, isLocked: false, isFree: true, isSuperstore: false };

    const isMine = item.claimedBy === currentUid;
    const isTaken = Boolean(item.claimedBy && !isMine);
    const ownsWarbond = RulesEngine.hasWarbondOwnership(item, userWarbonds);
    const isLocked = !isTaken && !ownsWarbond;
    const isSuperstore = RulesEngine.isSuperstore(item);

    return {
        isMine,
        isTaken,
        isLocked,
        isSuperstore
    };
};

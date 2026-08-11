import db from '../../database.json';

export const getSuperstoreItems = () => {
    const armors = db.armor.filter(a => a.warbondCode === 'superstore' || (a.tags && a.tags.includes('Superstore')));
    const primaries = db.primary.filter(a => a.warbondCode === 'superstore' || (a.tags && a.tags.includes('Superstore')));
    const secondaries = db.secondary.filter(a => a.warbondCode === 'superstore' || (a.tags && a.tags.includes('Superstore')));
    const grenades = db.grenade.filter(a => a.warbondCode === 'superstore' || (a.tags && a.tags.includes('Superstore')));

    return [
        ...armors.map(i => ({ ...i, type: 'armor' })),
        ...primaries.map(i => ({ ...i, type: 'primary' })),
        ...secondaries.map(i => ({ ...i, type: 'secondary' })),
        ...grenades.map(i => ({ ...i, type: 'grenade' }))
    ];
};

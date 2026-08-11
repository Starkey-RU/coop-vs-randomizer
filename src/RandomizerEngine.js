import BoosterManager from './BoosterManager';
import StratagemManager from './StratagemManager';
import ItemManager from './ItemManager';
import { createRng } from './utils/seededRandom';

class RandomizerEngine {
    constructor(database, seed = null) {
        this.database = database;
        this.rng = createRng(seed);
        this.reset();
    }

    _filterPoolByWarbonds(pool, allowedWarbonds) {
        if (!allowedWarbonds || !Array.isArray(allowedWarbonds)) return pool;
        
        return pool.filter(item => {
            const code = item.warbondCode || item.code;
            if (!code || code === 'none' || item.isBase) return true;
            return allowedWarbonds.includes(code) || allowedWarbonds.includes(item.id);
        });
    }

    reset(playerProfiles = null) {
        this.currentPool = JSON.parse(JSON.stringify(this.database));
        this.playerProfiles = playerProfiles; // { [playerIndex]: { warbonds: [...] } }
        
        let poolToUse = this.currentPool;

        // Если нам передали профили игроков, мы можем заранее отфильтровать 
        // командные пулы варбондов (например, бустеры должны быть доступны 
        // хотя бы одному игроку, но для простоты Модели 3, объединим все варбонды команды)
        if (playerProfiles) {
            const allAllowedWarbonds = new Set();
            Object.values(playerProfiles).forEach(profile => {
                if (profile && profile.warbonds) {
                    if (Array.isArray(profile.warbonds)) {
                        profile.warbonds.forEach(wb => allAllowedWarbonds.add(wb));
                    } else {
                        Object.keys(profile.warbonds).forEach(wb => {
                            if (profile.warbonds[wb]) allAllowedWarbonds.add(wb);
                        });
                    }
                }
            });
            // Ensure Free / Base Warbonds are always globally allowed so base items don't deplete to 0
            allAllowedWarbonds.add('warbond1'); 
            allAllowedWarbonds.add('warbond2'); 
            allAllowedWarbonds.add('warbond3');
            allAllowedWarbonds.add('none');
            const teamWarbondsArray = Array.from(allAllowedWarbonds);

            poolToUse = {
                primary: this.currentPool.primary, // Фильтруются для каждого игрока индивидуально
                secondary: this.currentPool.secondary,
                grenade: this.currentPool.grenade,
                armor: this.currentPool.armor,
                booster: this._filterPoolByWarbonds(this.currentPool.booster, teamWarbondsArray),
                stratagems: this._filterPoolByWarbonds(this.currentPool.stratagems, teamWarbondsArray)
            };
        }
        
        this.managers = {
            primary: new ItemManager(poolToUse.primary, this.rng),
            secondary: new ItemManager(poolToUse.secondary, this.rng),
            grenade: new ItemManager(poolToUse.grenade, this.rng),
            armor: new ItemManager(poolToUse.armor, this.rng),
            booster: new BoosterManager(poolToUse.booster, this.rng),
            stratagem: new StratagemManager(poolToUse.stratagems, this.rng)
        };
        
        this.rollHistory = [];
        this.rollCount = 0;
    }

    roll(players = []) {
        // players это массив объектов с profile (warbonds и т.д.)
        const playerCount = Math.min(4, Math.max(1, players.length));
        let teamBoosters = this.managers.booster.pickForTeam(playerCount);
        let builds = [];

        for (let i = 0; i < players.length; i++) {
            const playerConfig = players[i];
            const allowedWarbonds = playerConfig.warbonds;

            // Временно фильтруем оставшийся пул для этого конкретного игрока
            const myPrimaryPool = this._filterPoolByWarbonds(this.managers.primary.pool, allowedWarbonds);
            const mySecondaryPool = this._filterPoolByWarbonds(this.managers.secondary.pool, allowedWarbonds);
            const myGrenadePool = this._filterPoolByWarbonds(this.managers.grenade.pool, allowedWarbonds);
            const myArmorPool = this._filterPoolByWarbonds(this.managers.armor.pool, allowedWarbonds);
            
            builds.push({
                playerIndex: i + 1,
                uid: playerConfig.uid,
                primary: this.managers.primary.pickFromFilteredContext(myPrimaryPool),
                secondary: this.managers.secondary.pickFromFilteredContext(mySecondaryPool),
                grenade: this.managers.grenade.pickFromFilteredContext(myGrenadePool),
                armor: this.managers.armor.pickFromFilteredContext(myArmorPool),
                booster: teamBoosters[i] || null,
                stratagems: this.managers.stratagem.pickForPlayer(4, allowedWarbonds)
            });
        }

        const result = {
            rollNumber: ++this.rollCount,
            builds: builds
        };

        this.rollHistory.push(result);
        return result;
    }

    getPoolStatus() {
        return {
            primary: this.managers.primary.pool.length,
            secondary: this.managers.secondary.pool.length,
            grenade: this.managers.grenade.pool.length,
            armor: this.managers.armor.pool.length,
            boosterReady: this.managers.booster.normalPool.length + this.managers.booster.mustHaves.length,
            stratagems: this.managers.stratagem.pool.length
        };
    }
}

export default RandomizerEngine;
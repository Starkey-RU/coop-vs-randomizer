const fs = require('fs');
const path = require('path');

function processJSConstantFile(filename, variableName) {
    const filePath = path.join(__dirname, 'temp_data', 'js', 'constants', filename);
    let raw = fs.readFileSync(filePath, 'utf8');
    
    // Removing any possible "const " or "let " declarations so eval can just return the array
    raw = raw.replace(/const\s+\w+\s*=\s*/, `var ${variableName} = `);
    
    let result;
    try {
         eval(raw + `\n result = ${variableName};`);
    } catch (e) {
        console.log(`Failed to process ${filename}`, e);
        result = [];
    }
    return result;
}

try {
    const primaries = processJSConstantFile('primaries.js', 'PRIMARIES');
    const secondaries = processJSConstantFile('secondaries.js', 'SECONDARIES');
    const throwables = processJSConstantFile('throwables.js', 'THROWABLES'); 
    const boosters = processJSConstantFile('boosters.js', 'BOOSTERS');
    const armorsets = processJSConstantFile('armorsets.js', 'ARMOR_SETS'); 
    const stratagems = processJSConstantFile('stratagems.js', 'STRATAGEMS');
    
    // Logic to distinguish slot types in stratagems
    const weaponsWithBackpacks = ["rl112recoillessrifle", "faf14spear", "ac8autocannon", "rl4airburstrocketlauncher"];
    
    const processedStratagems = stratagems.map(s => {
        let isSupportWeapon = s.tags.includes('Weapons');
        let isBackpack = s.tags.includes('Backpacks');
        
        let slotType = 'Offensive/Defensive';
        if (isSupportWeapon && weaponsWithBackpacks.includes(s.internalName)) {
            slotType = 'Weapon+Backpack';
        } else if (isSupportWeapon) {
            slotType = 'Weapon';
        } else if (isBackpack) {
            slotType = 'Backpack';
        } else if (s.tags.includes('Vehicles') || (s.name && s.name.toLowerCase().includes('exosuit'))) {
            slotType = 'Vehicle';
        }

        let imageURL = `${s.displayName}.svg`;
        
        if (s.internalName === 'axlas5guarddogrover') imageURL = 'Guard Dog Rover.svg';
        if (s.internalName === 'ad334guarddog') imageURL = 'Guard Dog.svg';
        if (s.internalName === 'guarddogflames') imageURL = 'Guard Dog Hot Dog.svg';
        if (s.internalName === 'guarddogarc') imageURL = 'Guard Dog K-9.svg';
        if (s.internalName === 'axtx13guarddogdogbreath') imageURL = 'Guard Dog Breath.svg';
        
        if (s.internalName === 'flam40flamethrower') imageURL = 'Flamethrower.svg';
        if (s.internalName === 'rl112recoillessrifle') imageURL = 'Recoilless Rifle.svg';
        if (s.internalName === 'faf14spear') imageURL = 'Spear.svg';

        if (s.internalName === 'gl52deescalator') imageURL = 'GL-52 De-Escalator.svg';
        if (s.internalName === 'apw1antimaterielrifle') imageURL = 'Anti-Materiel Rifle.svg';
        if (s.internalName === 'stax3wasplauncher' || s.internalName === 'wasplauncher') imageURL = 'StA-X3 W.A.S.P. Launcher.svg';
        if (s.internalName === 'sh20ballisticshieldbackpack') imageURL = 'Ballistic Shield Backpack.svg';
        if (s.internalName === 'portablehellbomb') imageURL = 'Hellbomb Portable.svg';
        
        // Eagle mapping
        if (s.internalName === 'eagle110mmrocketpods') imageURL = 'Eagle 110MM Rocket Pods.svg';
        if (s.internalName === 'eagle500kgbomb') imageURL = 'Eagle 500KG Bomb.svg';

        if (s.internalName === 'eaglenapalmstrike') imageURL = 'Eagle Napalm Airstrike.svg';
        if (s.internalName === 'orbital120mmhebarrage') imageURL = 'Orbital 120MM HE Barrage.svg';
        if (s.internalName === 'orbital380mmhebarrage') imageURL = 'Orbital 380MM HE Barrage.svg';
        // Временные костыли для отсутствующих иконок (или иконок с кривыми именами в базе/ассетах)
        if (s.internalName === 'md6antipersonnelminefield' || s.internalName === 'antipersonnelmines') imageURL = 'Anti-Personnel Minefield.svg';
        if (s.internalName === 'md8gasmine' || s.internalName === 'gasmines' || s.displayName === 'Gas Mines') imageURL = 'Gas Mine.svg';
        
        // Исправляем миссии и кривые названия
        if (s.internalName === 'breachinghammer') imageURL = 'CQC-20.svg';
        if (s.internalName === 'leveller') imageURL = 'EAT-411.svg';
        if (s.internalName === 'beltfedgrenadelauncher') imageURL = 'GL-28.svg';
        if (s.internalName === 'bastion' || s.internalName === 'bastionmkxvi' || s.displayName === 'Bastion') imageURL = 'Bastion MK XVI.svg';
        if (s.displayName === 'Anti-Personnel Mines') imageURL = 'Anti-Personnel Minefield.svg';
        if (s.internalName === 'wasplauncher' || s.displayName === 'W.A.S.P. Launcher') imageURL = 'wasp.svg';

        return {
            id: s.internalName,
            name: s.displayName,
            slotType: slotType,
            category: s.category, 
            imageURL: imageURL,
            tags: s.tags
        };
    });

    const armorWarbondFixes = {
        'ce27groundbreaker': 'warbond4',
        'ce07demolitionspecialist': 'warbond4',
        'fs55devastator': 'warbond4',
        
        'cw4arcticranger': 'warbond5',
        'cw9whitewolf': 'warbond5',
        'cw22kodiak': 'warbond5',
        
        'sa12servoassisted': 'warbond1',
        'sa25steeltrooper': 'warbond1',
        'sa32dynamo': 'warbond1',
        
        'ex03prototype3': 'warbond3',
        'ex16prototype16': 'warbond3',
        'ex00prototypex': 'warbond3',

        'ph9predator': 'warbond8',
        'ph56jaguar': 'warbond8',
        'ph202twigsnapper': 'warbond8',

        'i09heatseeker': 'warbond9',
        'i92firefighter': 'warbond9',
        'i102draconaught': 'warbond9',

        'af50noxiousranger': 'warbond10',
        'af02hazmaster': 'warbond10',
        'af91fieldchemist': 'warbond10',
    };

    const knownCodes = ['none', 'warbond0', 'warbond1', 'warbond2', 'warbond3', 'warbond4', 'warbond5', 'warbond8', 'warbond9', 'warbond10', 'warbond11', 'warbond12', 'warbond13', 'warbond14', 'warbond15', 'warbond16', 'warbond17', 'warbond18', 'warbond23'];

    const database = {
        primary: primaries.map(p => ({ id: p.internalName, name: p.displayName, imageURL: p.imageURL, tags: p.tags, warbondCode: p.warbondCode || 'none' })),
        secondary: secondaries.map(s => ({ id: s.internalName, name: s.displayName, imageURL: s.imageURL, tags: s.tags, warbondCode: s.warbondCode || 'none' })),
        grenade: throwables.map(g => ({ id: g.internalName, name: g.displayName, imageURL: g.imageURL, tags: g.tags, warbondCode: g.warbondCode || 'none' })),
        booster: boosters.map(b => ({ id: b.internalName, name: b.displayName, imageURL: b.imageURL, tags: b.tags, warbondCode: b.warbondCode || 'none' })),
        armor: armorsets.map(a => {
            let code = armorWarbondFixes[a.internalName] || a.warbondCode || 'none';
            if (!knownCodes.includes(code)) {
                code = 'superstore';
            }
            return { id: a.internalName, name: a.displayName, passive: a.passive, tags: a.tags, imageURL: a.imageURL, warbondCode: code };
        }),
        stratagems: processedStratagems
    };

    fs.writeFileSync(path.join(__dirname, 'database.json'), JSON.stringify(database, null, 2));
    console.log(`Database generated successfully! Totals:
- Primaries: ${database.primary.length}
- Secondaries: ${database.secondary.length}
- Grenades: ${database.grenade.length}
- Boosters: ${database.booster.length}
- Armors: ${database.armor.length}
- Stratagems: ${database.stratagems.length}
    `);

} catch (err) {
    console.error("Critical error generating database:", err);
}
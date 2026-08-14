const fs = require('fs');

let code = fs.readFileSync('build_database.cjs', 'utf-8');

const regex = /\/\/ .*?(?=        return \{)/s;

const newBlock = `// Fixed mapping
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
        if (s.internalName === 'stax3wasplauncher') imageURL = 'StA-X3 W.A.S.P. Launcher.svg';
        if (s.internalName === 'sh20ballisticshieldbackpack') imageURL = 'Ballistic Shield Backpack.svg';
        if (s.internalName === 'portablehellbomb') imageURL = 'Hellbomb Portable.svg';
        
        if (s.internalName === 'eaglenapalmstrike') imageURL = 'Eagle Napalm Airstrike.svg';
        if (s.internalName === 'orbital120mmhebarrage') imageURL = 'Orbital 120MM HE Barrage.svg';
        if (s.internalName === 'orbital380mmhebarrage') imageURL = 'Orbital 380MM HE Barrage.svg';
        if (s.internalName === 'md6antipersonnelminefield') imageURL = 'Anti-Personnel Minefield.svg';
        if (s.internalName === 'md8gasmine') imageURL = 'Gas Mine.svg';
        
        if (s.internalName === 'breachinghammer') imageURL = 'Hive Breaker Drill.svg'; 
        if (s.internalName === 'leveller') imageURL = 'Tectonic Drill.svg';
        if (s.internalName === 'beltfedgrenadelauncher') imageURL = 'CQC-20.svg';
        if (s.internalName === 'bastion') imageURL = 'Bastion MK XVI.svg';

`;

code = code.replace(regex, newBlock);
fs.writeFileSync('build_database.cjs', code);
console.log('Replaced.');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registryPath = path.join(__dirname, '../src/utils/armorRegistry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

// Добавляем комбинацию пассивки
const newPassives = {
    "Concussive Padding, Reinforced": {
        name: "Контузионная защита & Усиление",
        desc: "-50% урона от взрывов и контузий, повышенный рейтинг защиты",
        icon: "ShieldAlert",
        color: "text-red-400"
    }
};

const dbPath = path.join(__dirname, '../database.json');
const database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Список всех 28 Тяжелых Комплектов Брони со скриншотов
const wikiHeavyArmors = [
    { name: "TR-62 Knight", passive: "Servo-Assisted", source: "Pre-Order Bonus", warbondCode: "warbond2" },
    { name: "FS-05 Marksman", passive: "Fortified", source: "Helldivers Mobilize!", warbondCode: "warbond1" },
    { name: "FS-23 Battle Master", passive: "Fortified", source: "Helldivers Mobilize!", warbondCode: "warbond1" },
    { name: "SA-32 Dynamo", passive: "Servo-Assisted", source: "Steeled Veterans", warbondCode: "warbond2" },
    { name: "B-27 Fortified Commando", passive: "Extra Padding", source: "Superstore", warbondCode: "superstore" },
    { name: "FS-61 Dreadnought", passive: "Servo-Assisted", source: "Superstore", warbondCode: "superstore" },
    { name: "FS-11 Executioner", passive: "Fortified", source: "Superstore", warbondCode: "superstore" },
    { name: "CM-17 Butcher", passive: "Med-Kit", source: "Superstore", warbondCode: "superstore" },
    { name: "FS-55 Devastator", passive: "Fortified", source: "Democratic Detonation", warbondCode: "warbond4" },
    { name: "CE-64 Grenadier", passive: "Engineering Kit", source: "Superstore", warbondCode: "superstore" },
    { name: "CW-36 Winter Warrior", passive: "Servo-Assisted", source: "Polar Patriots", warbondCode: "warbond5" },
    { name: "CW-22 Kodiak", passive: "Fortified", source: "Polar Patriots", warbondCode: "warbond5" },
    { name: "CE-101 Guerilla Gorilla", passive: "Engineering Kit", source: "Superstore", warbondCode: "superstore" },
    { name: "PH-202 Twigsnapper", passive: "Peak Physique", source: "Viper Commandos", warbondCode: "warbond8" },
    { name: "I-44 Salamander", passive: "Inflammable", source: "Superstore", warbondCode: "superstore" },
    { name: "AF-52 Lockdown", passive: "Advanced Filtration", source: "Superstore", warbondCode: "superstore" },
    { name: "SR-64 Cinderblock", passive: "Siege-Ready", source: "Superstore", warbondCode: "superstore" },
    { name: "SR-18 Roadblock", passive: "Siege-Ready", source: "Urban Legends", warbondCode: "warbond12" },
    { name: "GS-66 Lawmaker", passive: "Gunslinger", source: "Borderline Justice", warbondCode: "warbond24" },
    { name: "RE-824 Bearer of the Standard", passive: "Reinforced Epaulettes", source: "Superstore", warbondCode: "superstore" },
    { name: "BP-77 Grand Juror", passive: "Ballistic Padding", source: "Superstore", warbondCode: "superstore" },
    { name: "AD-49 Apollonian", passive: "Adreno-Defibrillator", source: "Control Group", warbondCode: "warbond25" },
    { name: "DS-42 Federation's Blade", passive: "Desert Stormer", source: "Dust Devils", warbondCode: "warbond27" },
    { name: "RS-40 Beast of Prey", passive: "Rock Solid", source: "Python Commandos", warbondCode: "warbond21" },
    { name: "SA-8 Ram", passive: "Supplementary Adrenaline", source: "Siege Breakers", warbondCode: "warbond28" },
    { name: "CPR-80 Bulwark", passive: "Concussive Padding, Reinforced", source: "Superstore", warbondCode: "superstore" },
    { name: "O-2 Heavy Operator", passive: "Oxygenator", source: "Exo Experts", warbondCode: "warbond17" },
    { name: "TG-122 Demo-Trooper", passive: "True Grit", source: "Castellan's Creed", warbondCode: "warbond16" }
];

let updatedCount = 0;
let addedCount = 0;

wikiHeavyArmors.forEach(wItem => {
    const cleanId = wItem.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let dbItem = database.armor.find(a => a.name.toLowerCase() === wItem.name.toLowerCase() || a.id === cleanId);
    
    if (dbItem) {
        dbItem.passive = wItem.passive;
        dbItem.warbondCode = wItem.warbondCode;
        if (!dbItem.tags.includes('Heavy')) {
            dbItem.tags = dbItem.tags.filter(t => t !== 'Light' && t !== 'Medium');
            dbItem.tags.push('Heavy');
        }
        if (wItem.source === 'Superstore' && !dbItem.tags.includes('Superstore')) {
            dbItem.tags.push('Superstore');
        }
        updatedCount++;
    } else {
        const tags = ['Heavy'];
        if (wItem.source === 'Superstore') tags.push('Superstore');
        database.armor.push({
            id: cleanId,
            name: wItem.name,
            passive: wItem.passive,
            tags: tags,
            imageURL: `${cleanId}.webp`,
            warbondCode: wItem.warbondCode
        });
        addedCount++;
    }
});

fs.writeFileSync(dbPath, JSON.stringify(database, null, 2), 'utf8');
console.log(`Heavy Armor Sync Complete! Updated: ${updatedCount}, Added: ${addedCount}`);

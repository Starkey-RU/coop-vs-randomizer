import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../database.json');
const rawData = fs.readFileSync(dbPath, 'utf8');
const database = JSON.parse(rawData);

// Полный точный список 29 комплектов Легкой Брони из 4 скриншотов Wiki
const wikiLightArmors = [
    { name: "SC-37 Legionnaire", passive: "Servo-Assisted", source: "Superstore", warbondCode: "superstore", cost: "150 SC" },
    { name: "SC-34 Infiltrator", passive: "Scout", source: "Helldivers Mobilize!", warbondCode: "warbond1", cost: "3 Medals" },
    { name: "SC-30 Trailblazer Scout", passive: "Scout", source: "Helldivers Mobilize!", warbondCode: "warbond1", cost: "50 Medals" },
    { name: "CE-74 Breaker", passive: "Engineering Kit", source: "Superstore", warbondCode: "superstore", cost: "250 SC" },
    { name: "FS-38 Eradicator", passive: "Fortified", source: "Superstore", warbondCode: "superstore", cost: "250 SC" },
    { name: "B-08 Light Gunner", passive: "Extra Padding", source: "Superstore", warbondCode: "superstore", cost: "150 SC" },
    { name: "CM-21 Trench Paramedic", passive: "Med-Kit", source: "Superstore", warbondCode: "superstore", cost: "250 SC" },
    { name: "CE-67 Titan", passive: "Engineering Kit", source: "Superstore", warbondCode: "superstore", cost: "150 SC" },
    { name: "EX-00 Prototype X", passive: "Electrical Conduit", source: "Cutting Edge", warbondCode: "warbond3", cost: "64 Medals" },
    { name: "CE-07 Demolition Specialist", passive: "Engineering Kit", source: "Democratic Detonation", warbondCode: "warbond4", cost: "45 Medals" },
    { name: "FS-37 Ravager", passive: "Engineering Kit", source: "Superstore", warbondCode: "superstore", cost: "250 SC" },
    { name: "CW-4 Arctic Ranger", passive: "Scout", source: "Polar Patriots", warbondCode: "warbond5", cost: "64 Medals" },
    { name: "PH-9 Predator", passive: "Peak Physique", source: "Viper Commandos", warbondCode: "warbond8", cost: "40 Medals" },
    { name: "I-09 Heatseeker", passive: "Inflammable", source: "Freedom's Flame", warbondCode: "warbond9", cost: "18 Medals" },
    { name: "AF-50 Noxious Ranger", passive: "Advanced Filtration", source: "Chemical Agents", warbondCode: "warbond10", cost: "40 Medals" },
    { name: "UF-16 Inspector", passive: "Unflinching", source: "Truth Enforcers", warbondCode: "warbond11", cost: "65 Medals" },
    { name: "SR-24 Street Scout", passive: "Siege-Ready", source: "Urban Legends", warbondCode: "warbond12", cost: "40 Medals" },
    { name: "AC-2 Obedient", passive: "Acclimated", source: "Righteous Revenants", warbondCode: "warbond18", cost: "55 Medals" },
    { name: "IE-57 Hell-Bent", passive: "Integrated Explosives", source: "Superstore", warbondCode: "superstore", cost: "250 SC" },
    { name: "GS-11 Democracy's Deputy", passive: "Gunslinger", source: "Superstore", warbondCode: "superstore", cost: "300 SC" },
    { name: "RE-1861 Parade Commander", passive: "Reinforced Epaulettes", source: "Masters of Ceremony", warbondCode: "warbond19", cost: "55 Medals" },
    { name: "BP-32 Jackboot", passive: "Ballistic Padding", source: "Force of Law", warbondCode: "warbond20", cost: "55 Medals" },
    { name: "AD-11 Livewire", passive: "Adreno-Defibrillator", source: "Superstore", warbondCode: "superstore", cost: "300 SC" },
    { name: "DS-10 Big Game Hunter", passive: "Desert Stormer", source: "Superstore", warbondCode: "superstore", cost: "300 SC" },
    { name: "RS-20 Constrictor", passive: "Rock Solid", source: "Python Commandos", warbondCode: "warbond21", cost: "45 Medals" },
    { name: "RS-100 Sanctioner", passive: "Reduced Signature", source: "Superstore", warbondCode: "superstore", cost: "250 SC" },
    { name: "RS-89 Shadow Paragon", passive: "Reduced Signature", source: "Redacted Regiment", warbondCode: "warbond22", cost: "45 Medals" },
    { name: "CPH-26 Commandant", passive: "Concussive Padding, Hazmat", source: "Entrenched Division", warbondCode: "warbond23", cost: "55 Medals" },
    { name: "O-3 Free Spirit", passive: "Oxygenator", source: "Exo Experts", warbondCode: "warbond17", cost: "45 Medals" }
];

console.log("Checking current armors count in DB:", database.armor ? database.armor.length : 0);

let updatedCount = 0;
let addedCount = 0;

wikiLightArmors.forEach(wItem => {
    const cleanId = wItem.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let dbItem = database.armor.find(a => a.name.toLowerCase() === wItem.name.toLowerCase() || a.id === cleanId);
    
    if (dbItem) {
        dbItem.passive = wItem.passive;
        dbItem.warbondCode = wItem.warbondCode;
        if (!dbItem.tags.includes('Light')) dbItem.tags.push('Light');
        if (wItem.source === 'Superstore' && !dbItem.tags.includes('Superstore')) {
            dbItem.tags.push('Superstore');
        }
        updatedCount++;
    } else {
        const tags = ['Light'];
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
console.log(`Synchronization Complete! Updated: ${updatedCount}, Added: ${addedCount}`);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registryPath = path.join(__dirname, '../src/utils/armorRegistry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

// Список новых пассивок из Средней Брони
const newPassives = {
    "Democracy Protects": {
        name: "Демократия защищает",
        desc: "50% шанс выжить при получении смертельного урона. Защищает от кровотечения",
        icon: "ShieldAlert",
        color: "text-yellow-400"
    },
    "Feet First": {
        name: "Вперед ногами",
        desc: "Снижает урон от падения и ускоряет подъем на ноги",
        icon: "Feather",
        color: "text-emerald-300"
    },
    "Supplementary Adrenaline": {
        name: "Доп. адреналин",
        desc: "Увеличивает скорость бега при получении ранения",
        icon: "Zap",
        color: "text-rose-400"
    },
    "Concussive Padding, Grenadier": {
        name: "Контузионная защита & Гренадер",
        desc: "+2 гранаты, -50% урона от взрывов и контузий",
        icon: "Wrench",
        color: "text-amber-500"
    },
    "True Grit": {
        name: "Истинная выдержка",
        desc: "Повышает стойкость в ближнем бою и к ошеломляющим атакам",
        icon: "Shield",
        color: "text-red-500"
    }
};

const dbPath = path.join(__dirname, '../database.json');
const database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Список всех 46 Средних Комплектов Брони со скриншотов
const wikiMediumArmors = [
    { name: "B-01 Tactical", passive: "Extra Padding", source: "Starter Equipment", warbondCode: "none" },
    { name: "TR-7 Ambassador of the Brand", passive: "Extra Padding", source: "Pre-Order Bonus", warbondCode: "warbond2" },
    { name: "TR-9 Cavalier of Democracy", passive: "Democracy Protects", source: "Pre-Order Bonus", warbondCode: "warbond2" },
    { name: "DP-53 Savior of the Free", passive: "Democracy Protects", source: "Super Citizen Edition", warbondCode: "warbond0" },
    { name: "TR-117 Alpha Commander", passive: "Med-Kit", source: "Downloadable Content", warbondCode: "warbond17" },
    { name: "SC-15 Drone Master", passive: "Engineering Kit", source: "Superstore", warbondCode: "superstore" },
    { name: "CE-35 Trench Engineer", passive: "Engineering Kit", source: "Helldivers Mobilize!", warbondCode: "warbond1" },
    { name: "CM-09 Bonesnapper", passive: "Med-Kit", source: "Helldivers Mobilize!", warbondCode: "warbond1" },
    { name: "DP-40 Hero of the Federation", passive: "Democracy Protects", source: "Helldivers Mobilize!", warbondCode: "warbond1" },
    { name: "SA-04 Combat Technician", passive: "Scout", source: "Helldivers Mobilize!", warbondCode: "warbond1" },
    { name: "CM-14 Physician", passive: "Med-Kit", source: "Helldivers Mobilize!", warbondCode: "warbond1" },
    { name: "DP-11 Champion of the People", passive: "Democracy Protects", source: "Helldivers Mobilize!", warbondCode: "warbond1" },
    { name: "SA-25 Steel Trooper", passive: "Servo-Assisted", source: "Steeled Veterans", warbondCode: "warbond2" },
    { name: "SA-12 Servo Assisted", passive: "Servo-Assisted", source: "Steeled Veterans", warbondCode: "warbond2" },
    { name: "B-24 Enforcer", passive: "Fortified", source: "Superstore", warbondCode: "superstore" },
    { name: "CE-81 Juggernaut", passive: "Engineering Kit", source: "Superstore", warbondCode: "superstore" },
    { name: "FS-34 Exterminator", passive: "Fortified", source: "Superstore", warbondCode: "superstore" },
    { name: "EX-03 Prototype 3", passive: "Electrical Conduit", source: "Cutting Edge", warbondCode: "warbond3" },
    { name: "EX-16 Prototype 16", passive: "Electrical Conduit", source: "Cutting Edge", warbondCode: "warbond3" },
    { name: "CE-27 Ground Breaker", passive: "Engineering Kit", source: "Democratic Detonation", warbondCode: "warbond4" },
    { name: "CM-10 Clinician", passive: "Med-Kit", source: "Superstore", warbondCode: "superstore" },
    { name: "CW-9 White Wolf", passive: "Extra Padding", source: "Superstore", warbondCode: "superstore" },
    { name: "PH-56 Jaguar", passive: "Peak Physique", source: "Superstore", warbondCode: "superstore" },
    { name: "TR-40 Gold Eagle", passive: "Extra Padding", source: "Escalation of Freedom", warbondCode: "none" },
    { name: "I-92 Fire Fighter", passive: "Inflammable", source: "Superstore", warbondCode: "superstore" },
    { name: "I-102 Draconaught", passive: "Inflammable", source: "Freedom's Flame", warbondCode: "warbond9" },
    { name: "AF-91 Field Chemist", passive: "Advanced Filtration", source: "Superstore", warbondCode: "superstore" },
    { name: "AF-02 Haz-Master", passive: "Advanced Filtration", source: "Chemical Agents", warbondCode: "warbond10" },
    { name: "DP-00 Tactical", passive: "Democracy Protects", source: "Liberty Day", warbondCode: "none" },
    { name: "UF-84 Doubt Killer", passive: "Unflinching", source: "Superstore", warbondCode: "superstore" },
    { name: "UF-50 Bloodhound", passive: "Unflinching", source: "Truth Enforcers", warbondCode: "warbond11" },
    { name: "AC-1 Dutiful", passive: "Acclimated", source: "Righteous Revenants", warbondCode: "warbond18" },
    { name: "IE-3 Martyr", passive: "Integrated Explosives", source: "Servants of Freedom", warbondCode: "warbond13" },
    { name: "IE-12 Righteous", passive: "Integrated Explosives", source: "Servants of Freedom", warbondCode: "warbond13" },
    { name: "B-22 Model Citizen", passive: "Democracy Protects", source: "Anniversary Gift", warbondCode: "none" },
    { name: "GS-17 Frontier Marshal", passive: "Gunslinger", source: "Borderline Justice", warbondCode: "warbond24" },
    { name: "RE-2310 Honorary Guard", passive: "Reinforced Epaulettes", source: "Masters of Ceremony", warbondCode: "warbond19" },
    { name: "BP-20 Correct Officer", passive: "Ballistic Padding", source: "Force of Law", warbondCode: "warbond20" },
    { name: "AD-26 Bleeding Edge", passive: "Adreno-Defibrillator", source: "Control Group", warbondCode: "warbond25" },
    { name: "A-9 Helljumper", passive: "Feet First", source: "Halo: ODST", warbondCode: "warbond26" },
    { name: "A-35 Recon", passive: "Feet First", source: "Halo: ODST", warbondCode: "warbond26" },
    { name: "DS-191 Scorpion", passive: "Desert Stormer", source: "Dust Devils", warbondCode: "warbond27" },
    { name: "RS-6 Fiend Destroyer", passive: "Rock Solid", source: "Superstore", warbondCode: "superstore" },
    { name: "RS-67 Null Cipher", passive: "Reduced Signature", source: "Redacted Regiment", warbondCode: "warbond22" },
    { name: "SA-7 Headfirst", passive: "Supplementary Adrenaline", source: "Siege Breakers", warbondCode: "warbond28" },
    { name: "DP-8 Mountain-Scaled", passive: "Siege-Ready", source: "Superstore", warbondCode: "superstore" },
    { name: "CPG-48 Sapper", passive: "Concussive Padding, Grenadier", source: "Entrenched Division", warbondCode: "warbond23" },
    { name: "O-44 Bonded Pilot", passive: "Oxygenator", source: "Superstore", warbondCode: "superstore" },
    { name: "TG-8 Sharpshooter", passive: "True Grit", source: "Castellan's Creed", warbondCode: "warbond16" }
];

let updatedCount = 0;
let addedCount = 0;

wikiMediumArmors.forEach(wItem => {
    const cleanId = wItem.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let dbItem = database.armor.find(a => a.name.toLowerCase() === wItem.name.toLowerCase() || a.id === cleanId);
    
    if (dbItem) {
        dbItem.passive = wItem.passive;
        dbItem.warbondCode = wItem.warbondCode;
        if (!dbItem.tags.includes('Medium')) {
            dbItem.tags = dbItem.tags.filter(t => t !== 'Light' && t !== 'Heavy');
            dbItem.tags.push('Medium');
        }
        if (wItem.source === 'Superstore' && !dbItem.tags.includes('Superstore')) {
            dbItem.tags.push('Superstore');
        }
        updatedCount++;
    } else {
        const tags = ['Medium'];
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
console.log(`Medium Armor Sync Complete! Updated: ${updatedCount}, Added: ${addedCount}`);

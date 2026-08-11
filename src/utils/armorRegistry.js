import React from 'react';
import { 
    Zap, 
    Shield, 
    Heart, 
    Wrench, 
    Crosshair, 
    Flame, 
    Activity, 
    Dumbbell, 
    Feather, 
    ShieldAlert, 
    Anchor,
    Wind,
    Radio,
    Sparkles,
    Skull,
    Target,
    Award,
    Cross,
    Feather as WindIcon,
    Mountain,
    EyeOff,
    Biohazard,
    ShoppingBag,
    BookOpen,
    Clock
} from 'lucide-react';

import { LEGENDARY_WARBONDS } from './warbondRegistry';

/**
 * Весовые категории брони
 */
export const ArmorWeight = {
    LIGHT: 'Light',
    MEDIUM: 'Medium',
    HEAVY: 'Heavy'
};

export const ARMOR_WEIGHT_META = {
    Light: {
        label: 'Легкая',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        icon: Feather
    },
    Medium: {
        label: 'Средняя',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        icon: Shield
    },
    Heavy: {
        label: 'Тяжелая',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: ShieldAlert
    }
};

/**
 * Карта всех Заслуг (Warbonds) и Источников получения
 */
export const WARBOND_NAMES = {
    "none": "Базовый комплект",
    "warbond1": "Helldivers Mobilize!",
    "warbond2": "Steeled Veterans",
    "warbond3": "Cutting Edge",
    "warbond4": "Democratic Detonation",
    "warbond5": "Polar Patriots",
    "warbond6": "Viper Commandos",
    "warbond7": "Freedom's Flame",
    "warbond8": "Chemical Agents",
    "warbond9": "Truth Enforcers",
    "warbond10": "Urban Legends",
    "warbond11": "Righteous Revenants",
    "warbond12": "Masters of Ceremony",
    "warbond13": "Force of Law",
    "warbond14": "Python Commandos",
    "warbond15": "Redacted Regiment",
    "warbond16": "Entrenched Division",
    "warbond17": "Exo Experts",
    "warbond18": "Obedient Democracy",
    "superstore": "Superstore (Супермагазин)"
};

/**
 * Определение источника получения предмета/брони
 */
export function getItemSourceMeta(item) {
    if (!item) return { label: 'Неизвестно', isSuperstore: false, icon: null, color: 'text-gray-400', hasIcon: false };

    const tags = item.tags || [];
    const isSuperstore = tags.includes('Superstore') || item.warbondCode === 'superstore' || (item.warbondCode === 'none' && tags.includes('superstore'));

    if (isSuperstore || item.warbondCode === 'superstore') {
        return {
            label: 'Superstore',
            isSuperstore: true,
            icon: ShoppingBag,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/30',
            hasIcon: true
        };
    }

    const warbondCode = item.warbondCode;
    const isLegendary = LEGENDARY_WARBONDS.some(lw => lw.code === warbondCode);

    const warbondName = WARBOND_NAMES[warbondCode] || warbondCode || 'Helldivers Mobilize!';

    if (!isLegendary) {
        return {
            label: warbondName,
            isSuperstore: false,
            icon: null,
            color: 'text-gray-400',
            bgColor: 'bg-gray-800/10',
            borderColor: 'border-gray-700/30',
            hasIcon: false
        };
    }

    return {
        label: warbondName,
        isSuperstore: false,
        icon: BookOpen,
        color: 'text-amber-300',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        hasIcon: true
    };
}

/**
 * Полный реестр пассивных эффектов брони Helldivers 2
 */
export const ARMOR_PASSIVE_META = {
    "Extra Padding": {
        desc: "Provides a higher armor rating.",
        icon: Shield,
        color: "text-blue-400"
    },
    "Engineering Kit": {
        desc: "Further reduces recoil when crouching or prone by 30%.\nIncreases initial inventory and holding capacity of throwables by +2.",
        icon: Wrench,
        color: "text-amber-400"
    },
    "Med-Kit": {
        desc: "Increases initial inventory and holding capacity of stims by +2.\nIncreases stim effect duration by 2.0s.",
        icon: Heart,
        color: "text-emerald-400"
    },
    "Scout": {
        desc: "Markers placed on the map will generate radar scans every 2.0s.\nReduces range at which enemies can detect the wearer by 30%.",
        icon: Radio,
        color: "text-cyan-400"
    },
    "Servo-Assisted": {
        desc: "Increases throwing range by 30%.\nProvides +50% limb health.",
        icon: Anchor,
        color: "text-purple-400"
    },
    "Fortified": {
        desc: "Further reduces recoil when crouching or prone by 30%.\nProvides 50% resistance to explosive damage.",
        icon: ShieldAlert,
        color: "text-orange-400"
    },
    "Electrical Conduit": {
        desc: "Provides 95% resistance to arc damage.",
        icon: Zap,
        color: "text-yellow-400"
    },
    "Peak Physique": {
        desc: "Increases melee damage by 40%.\nImproves weapons handling with less drag on weapon movement.",
        icon: Dumbbell,
        color: "text-red-400"
    },
    "Inflammable": {
        desc: "Provides 75% damage resistance to fire, allowing bearer to rest assured in their inflammability.",
        icon: Flame,
        color: "text-rose-400"
    },
    "Advanced Filtration": {
        desc: "Provides 80% resistance to gas damage and effects.",
        icon: Wind,
        color: "text-green-400"
    },
    "Unflinching": {
        desc: "Helps prevent Helldivers from flinching when hit.\nProvides a higher armor rating.\nMarkers placed on the map will generate radar scans every 2.0s.",
        icon: Activity,
        color: "text-indigo-400"
    },
    "Siege-Ready": {
        desc: "Increases reload speed of primary weapons by 30%.\nIncreases ammo capacity of all weapons by 20%. Does not affect weapon backpacks.",
        icon: Crosshair,
        color: "text-teal-400"
    },
    "Siege Ready": {
        desc: "Increases reload speed of primary weapons by 30%.\nIncreases ammo capacity of all weapons by 20%. Does not affect weapon backpacks.",
        icon: Crosshair,
        color: "text-teal-400"
    },
    "Acclimated": {
        desc: "Provides 50% resistance to fire, gas, acid, and electrical damage.",
        icon: Sparkles,
        color: "text-sky-400"
    },
    "Integrated Explosives": {
        desc: "Armor explodes 1.5s after the wearer dies.\nIncreases initial inventory and holding capacity of throwables by +2.",
        icon: Skull,
        color: "text-red-500"
    },
    "Gunslinger": {
        desc: "Increases sidearms reload speed by 40%.\nSidearm draw/holster speed increased by 50%.\nSidearm recoil reduced by 70%.",
        icon: Target,
        color: "text-amber-300"
    },
    "Reinforced Epaulettes": {
        desc: "Increases reload speed of primary weapons by 30%.\nGives wearer a 50% chance to avoid grievous limb injury.\nIncreases melee damage by 20%.",
        icon: Award,
        color: "text-yellow-500"
    },
    "Ballistic Padding": {
        desc: "Provides 25% resistance to chest damage.\nProvides 25% resistance to explosive damage.\nPrevents all damage from bleeding if chest hemorrhages.",
        icon: Shield,
        color: "text-blue-300"
    },
    "Adreno-Defibrillator": {
        desc: "Provides one-time, short-lived resuscitation upon death, given that the Helldiver's body is still intact.\nIncreases stim effect duration by 2.0s.\nProvides 50% resistance to arc damage.",
        icon: Cross,
        color: "text-rose-500"
    },
    "Desert Stormer": {
        desc: "Provides 40% resistance to fire, gas, acid, and electrical damage.\nIncreases throwing range by 20%.",
        icon: WindIcon,
        color: "text-yellow-600"
    },
    "Rock Solid": {
        desc: "Increases melee damage by 40%.\nBearer is more resistant to being knocked prone.",
        icon: Mountain,
        color: "text-amber-600"
    },
    "Reduced Signature": {
        desc: "Wearer makes 50% less noise when moving.\nReduces range at which enemies can detect the wearer by 40%.",
        icon: EyeOff,
        color: "text-slate-400"
    },
    "Concussive Padding, Grenadier": {
        desc: "Provides 50% resistance to explosive damage.\nIncreases initial inventory and holding capacity of throwables by +2.",
        icon: Biohazard,
        color: "text-amber-400"
    },
    "Concussive Padding, Hazmat": {
        desc: "Provides 50% resistance to explosive damage.\nProvides 25% resistance to gas damage and effects.\nSidearm recoil reduced by 30%.",
        icon: Biohazard,
        color: "text-lime-400"
    },
    "Concussive Padding, Reinforced": {
        desc: "Provides 50% resistance to explosive damage.\nProvides a higher armor rating.",
        icon: Biohazard,
        color: "text-emerald-400"
    },
    "Oxygenator": {
        desc: "Increases the wearer's walking speed and running speed.\nIncreases the speed and duration of slides.",
        icon: Sparkles,
        color: "text-cyan-300"
    },
    "Kinetic Displacement Mitigation": {
        desc: "Provides 50% damage resistance to fire. Gives wearer a 50% chance to avoid grievous limb injury. Reduces damage taken from impact and collisions by 30%.",
        icon: Clock,
        color: "text-blue-500"
    },
    "Feet First": {
        desc: "Wearer makes 50% less noise when moving.\nIncreases point-of-interest identification range by 30%.\nProvides immunity to leg injuries.",
        icon: Feather,
        color: "text-emerald-300"
    },
    "Democracy Protects": {
        desc: "50% chance to not die when taking lethal damage.\nPrevents all damage from bleeding if chest hemorrhages.",
        icon: Shield,
        color: "text-yellow-400"
    },
    "True Grit": {
        desc: "Provides +20 Weapon Handling.\nProvides +30% Reload Speed for Support Weapons.",
        icon: Target,
        color: "text-orange-400"
    }
};

export function getArmorPassiveIconPath(passiveName) {
    if (!passiveName || passiveName === '???') return null;
    const baseName = passiveName.split(',')[0].trim();
    
    const iconMap = {
        "Acclimated": "/passive_armor/Acclimated_Armor_Passive_Icon.svg",
        "Adreno-Defibrillator": "/passive_armor/Adreno-Defibrillator_Armor_Passive_Icon.svg",
        "Advanced Filtration": "/passive_armor/Advanced_Filtration_Armor_Passive_Icon.svg",
        "Ballistic Padding": "/passive_armor/Ballistic_Padding_Armor_Passive_Icon.svg",
        "Concussive Padding": "/passive_armor/Concussive_Padding_Armor_Passive_Icon.svg",
        "Democracy Protects": "/passive_armor/Democracy_Protects_Armor_Passive_Icon.svg",
        "Desert Stormer": "/passive_armor/Desert_Stormer_Armor_Passive_Icon.svg",
        "Electrical Conduit": "/passive_armor/Electrical_Conduit_Armor_Passive_Icon.svg",
        "Engineering Kit": "/passive_armor/Engineering_Kit_Armor_Passive_Icon.svg",
        "Extra Padding": "/passive_armor/Extra_Padding_Armor_Passive_Icon.svg",
        "Feet First": "/passive_armor/Feet_First_Armor_Passive_Icon.svg",
        "Fortified": "/passive_armor/Fortified_Armor_Passive_Icon.svg",
        "Gunslinger": "/passive_armor/Gunslinger_Armor_Passive_Icon.svg",
        "Inflammable": "/passive_armor/Inflammable_Armor_Passive_Icon.svg",
        "Integrated Explosives": "/passive_armor/Integrated_Explosives_Armor_Passive_Icon.svg",
        "Med-Kit": "/passive_armor/Med-Kit_Armor_Passive_Icon.svg",
        "Oxygenator": "/passive_armor/Oxygenator_Armor_Passive_Icon.svg",
        "Peak Physique": "/passive_armor/Peak_Physique_Armor_Passive_Icon.svg",
        "Reduced Signature": "/passive_armor/Reduced_Signature_Armor_Passive_Icon.svg",
        "Reinforced Epaulettes": "/passive_armor/Reinforced_Epaulettes_Armor_Passive_Icon.svg",
        "Rock Solid": "/passive_armor/Rock_Solid_Armor_Passive_Icon.svg",
        "Scout": "/passive_armor/Scout_Armor_Passive_Icon.svg",
        "Servo-Assisted": "/passive_armor/Servo-Assisted_Armor_Passive_Icon.svg",
        "Siege-Ready": "/passive_armor/Siege-Ready_Armor_Passive_Icon.svg",
        "Siege Ready": "/passive_armor/Siege-Ready_Armor_Passive_Icon.svg",
        "Supplementary Adrenaline": "/passive_armor/Supplementary_Adrenaline_Armor_Passive_Icon.svg",
        "True Grit": "/passive_armor/True_Grit_Passive_Icon.png",
        "Unflinching": "/passive_armor/Unflinching_Armor_Passive_Icon.svg"
    };

    return iconMap[baseName] || null;
}

export function getArmorPassiveMeta(passiveName) {
    if (!passiveName) return null;
    const meta = ARMOR_PASSIVE_META[passiveName];
    return {
        name: passiveName,
        desc: meta ? meta.desc : passiveName,
        icon: meta ? meta.icon : Sparkles,
        color: meta ? meta.color : "text-gray-400"
    };
}

export function getArmorWeightMeta(tags = []) {
    if (tags.includes('Light')) return ARMOR_WEIGHT_META.Light;
    if (tags.includes('Heavy')) return ARMOR_WEIGHT_META.Heavy;
    return ARMOR_WEIGHT_META.Medium;
}

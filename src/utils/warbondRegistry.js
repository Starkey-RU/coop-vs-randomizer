export const WARBONDS = [
    { code: "warbond1", name: "Helldivers Mobilize!", isFree: true },
    { code: "warbond2", name: "Steeled Veterans" },
    { code: "warbond3", name: "Cutting Edge" },
    { code: "warbond4", name: "Democratic Detonation" },
    { code: "warbond5", name: "Polar Patriots" },
    { code: "warbond6", name: "Viper Commandos" },
    { code: "warbond7", name: "Freedom's Flame" },
    { code: "warbond8", name: "Chemical Agents" },
    { code: "warbond9", name: "Truth Enforcers" },
    { code: "warbond10", name: "Urban Legend" },
    { code: "warbond11", name: "Servants of Freedom" },
    { code: "warbond12", name: "Exo Experts" },
    { code: "warbond13", name: "Federation Frontline" },
    { code: "warbond14", name: "Keen Commander" }
];

export const LEGENDARY_WARBONDS = [
    { code: "warbond0", name: "Super Citizen (DP-53 armor & Knight)" },
    { code: "warbond15", name: "Pre-order (TR-7, TR-9, TR-62)" },
    { code: "warbond17", name: "Twitch Drops (Alpha Commander)" },
    { code: "warbond18", name: "Obedient Democracy (Halo)" },
    { code: "warbond23", name: "Righteous Revenants (Killzone)" },
    { code: "warbond16", name: "Entrenched Division" }
];

export const getDefaultWarbonds = () => {
    return ["warbond1", "none"]; 
};

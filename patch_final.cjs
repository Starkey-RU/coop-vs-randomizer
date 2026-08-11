const fs = require('fs');
const pathPool = 'F:/A_SRAN/coop-vs-randomizer/src/components/modes/RandomPool.jsx';
let codePool = fs.readFileSync(pathPool, 'utf8');
codePool = codePool.replace(
    'Allocate initial supply limits based on operational duration and squad size. Resources are finite.',
    'Распределение начальных лимитов снабжения на основе длительности операции и размера отряда. Ресурсы конечны.'
);
fs.writeFileSync(pathPool, codePool, 'utf8');

const pathChaos = 'F:/A_SRAN/coop-vs-randomizer/src/components/modes/ChaosMode.jsx';
let codeChaos = fs.readFileSync(pathChaos, 'utf8');

// Fix Header Alignment
const oldHeader = '<div className="steam-group-box-title flex items-center justify-between w-[calc(100%-16px)] px-2 pb-1 top-1 left-2">';
const newHeader = '<div className="absolute top-0 left-0 w-full px-2 pt-1 pb-1 flex items-center justify-between z-10">';
codeChaos = codeChaos.replace(oldHeader, newHeader);

// Fix ArmorSlot rendering correctly
// Original modification had w-full h-full flex flex-col items-stretch [&>div]:h-full [&>div]:flex-1
const searchArmorSlotRegex = /function ArmorSlot.*?return\s*\(\s*<div.*?>\s*<ArmorDisplay item=\{item\}\s*\/>\s*<\/div>\s*\);\s*}/s;
const newArmorSlot = `function ArmorSlot({ item }) {
    if (!item) return <EmptySlot label="Armor" />;
    return (
        <div className="absolute inset-0 w-full h-full">
            <ArmorDisplay item={item} />
        </div>
    );
}`;
codeChaos = codeChaos.replace(searchArmorSlotRegex, newArmorSlot);

// Fix grid container for Armor to be relative so absolute inset-0 works
const oldGridArmor = '<div className="shrink-0 w-[95px] lg:w-[110px] flex items-stretch">';
const newGridArmor = '<div className="shrink-0 w-[95px] lg:w-[110px] relative">';
codeChaos = codeChaos.replace(oldGridArmor, newGridArmor);

// Fallback in case oldGridArmor was different
const fallbackGridArmor = '<div className="shrink-0 w-[100px] lg:w-[130px] flex items-stretch mx-1">';
const fallbackNewGridArmor = '<div className="shrink-0 w-[100px] lg:w-[130px] relative mx-1">';
codeChaos = codeChaos.replace(fallbackGridArmor, fallbackNewGridArmor);

fs.writeFileSync(pathChaos, codeChaos, 'utf8');
console.log('Final patch complete');

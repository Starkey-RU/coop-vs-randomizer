const fs = require('fs');

try {
    // 1. FIX ARMOR DISPLAY
    const armorPath = 'F:/A_SRAN/coop-vs-randomizer/src/components/ui/ArmorDisplay.jsx';
    let armorCode = fs.readFileSync(armorPath, 'utf8');

    const startIdx = armorCode.indexOf('return (');
    const catchIdx = armorCode.indexOf('} catch (err) {');

    if (startIdx !== -1 && catchIdx !== -1) {
        // Find the 'return (' for the non-compact version.
        const nonCompactStart = armorCode.lastIndexOf('return (', catchIdx - 5);
        if (nonCompactStart !== -1) {
            const newArmorDisplay = `return (
            <div className="w-full h-full relative group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors hover:z-[60] bg-hcPanel flex flex-col overflow-visible steam-inset-box">
                <div className="flex-1 w-full relative min-h-0 bg-hcDark/30">
                    {showImage && (
                        <img 
                            src={\`/assets/images/\${item.imageURL}\`} 
                            alt={item.name} 
                            className="absolute inset-0 w-full h-full object-cover sm:object-contain object-top"
                            onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                    )}
                    <div className="absolute top-1 left-1 flex flex-col gap-1 z-10">
                        <div className={\`\${weightMeta.bgColor || 'bg-black/80'} \${weightMeta.color} border \${weightMeta.borderColor} rounded-sm p-1 shadow-sm\`} title={weightMeta.label}>
                            <WeightIcon size={12} />
                        </div>
                    </div>
                </div>

                <div className="shrink-0 px-1 py-1 bg-black/60 border-t border-[var(--steam-border-dark)] z-10">
                    <span className="text-[9px] block text-center text-gray-300 uppercase font-black leading-tight truncate px-0.5 tracking-wide">
                        {item.name.replace("'", "")}
                    </span>
                </div>

                {showTooltip && (
                    <div className="absolute w-[220px] bottom-[110%] left-1/2 -translate-x-1/2 mb-2 p-2 bg-hcDark border border-[var(--steam-border-light)] z-[99999] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-[0_0_15px_rgba(0,0,0,0.8)] rounded-sm flex flex-col gap-1.5 isolate">
                        <h4 className="font-bold text-xs text-white border-b border-hcBorder/40 pb-1">{item.name.replace("'", "")}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-white">
                            <WeightIcon size={12} className={weightMeta.color} />
                            <span className="uppercase font-bold tracking-widest">{weightMeta.label} Armor</span>
                        </div>
                        {passiveMeta && (
                            <div className="flex flex-col gap-1 mt-1 bg-black/40 p-1.5 rounded border border-hcBorder/20">
                                <div className="flex items-center gap-1.5 text-hcYellow font-bold text-[10px] uppercase tracking-wider">
                                    {passiveIconPath && <img src={passiveIconPath} alt="" className="w-3.5 h-3.5" />}
                                    <span>{passiveMeta.name}</span>
                                </div>
                                {passiveMeta.desc && <p className="text-[9px] text-slate-300 leading-tight">{passiveMeta.desc}</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    `;
            armorCode = armorCode.substring(0, nonCompactStart) + newArmorDisplay + armorCode.substring(catchIdx);
            fs.writeFileSync(armorPath, armorCode, 'utf8');
            console.log('ArmorDisplay patched.');
        }
    }


    // 2. FIX CHAOS MODE COMPACTNESS & Z-INDEX
    const chaosPath = 'F:/A_SRAN/coop-vs-randomizer/src/components/modes/ChaosMode.jsx';
    let chaosCode = fs.readFileSync(chaosPath, 'utf8');

    // Make the Armor grid slot full height and properly relative.
    const armorSlotRegex = /function ArmorSlot.*?return\s*\(\s*<div.*?>\s*<ArmorDisplay item=\{item\}\s*\/>\s*<\/div>\s*\);\s*}/s;
    const newArmorSlot = `function ArmorSlot({ item }) {
    if (!item) return <EmptySlot label="Armor" />;
    return (
        <div className="absolute inset-0 w-full h-full flex flex-col">
            <ArmorDisplay item={item} />
        </div>
    );
}`;
    chaosCode = chaosCode.replace(armorSlotRegex, newArmorSlot);

    // Make grid structure compact
    chaosCode = chaosCode.replace(/min-h-\[280px\] pt-7 pb-2 px-2/g, 'min-h-[220px] pt-6 pb-1 px-1');
    
    // Change min-h-[190px] to fixed or compact height
    chaosCode = chaosCode.replace(/min-h-\[190px\]/g, 'h-[150px]');
    
    // Change weapon and gadget slot heights
    chaosCode = chaosCode.replace(/h-\[90px\]/g, 'h-[72px]');
    
    chaosCode = chaosCode.replace(/w-12 h-12/g, 'w-9 h-9');
    chaosCode = chaosCode.replace(/h-16 w-full/g, 'h-11 w-full');
    
    // Fix z-index stacking context for tooltips
    chaosCode = chaosCode.replace('<div className="steam-inset-box p-3 flex-1 flex flex-col gap-3', '<div className="steam-inset-box p-1.5 flex-1 flex flex-col gap-1.5');
    chaosCode = chaosCode.replace('<div className="grid grid-cols-[1fr_auto_1fr] flex-1 gap-2', '<div className="grid grid-cols-[1fr_auto_1fr] flex-1 gap-1.5 relative z-50');

    // Make stratagems compact and rectangle
    chaosCode = chaosCode.replace(/aspect-square/g, 'aspect-[2.5/2] sm:aspect-[4/3]');
    
    fs.writeFileSync(chaosPath, chaosCode, 'utf8');
    console.log('ChaosMode patched.');

} catch (err) {
    console.error(err);
}

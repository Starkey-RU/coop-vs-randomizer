const fs = require('fs');

const pathOp = 'F:/A_SRAN/coop-vs-randomizer/src/components/draft/OperationPanel.jsx';
let opCode = fs.readFileSync(pathOp, 'utf8');

opCode = opCode.replace('ИНФО ОТРИЯДА', 'ЛИЧНЫЙ СОСТАВ');
opCode = opCode.replace('<Settings size={12}/>', '<UserCheck size={14}/>');

const oldSettings = `{isHost && showOptions && (
                <SteamBox title="НАСТРОЙКИ СЕРВЕРА" className="text-xs mx-2">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-hcDark p-1 rounded">
                        <input type="checkbox" checked={roomOptions?.depleteBoosters || false} onChange={handleToggleDepleteBoosters} className="accent-hcYellow" />
                        <span className="text-hcMuted tracking-wider font-semibold">ИСТОЩАТЬ БУСТЕРЫ</span>
                    </label>
                </SteamBox>
            )}`;

const newSettings = `{isHost && showOptions && (
                <SteamBox title="НАСТРОЙКИ ЛОГИСТИКИ" className="text-[10px] mx-2">
                    <div className="grid grid-cols-2 gap-1 px-1">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-hcDark p-1.5 rounded transition-colors bg-black/20 border border-hcBorder/20">
                            <input type="checkbox" checked={roomOptions?.depleteBoosters || false} onChange={handleToggleDepleteBoosters} className="accent-hcYellow" />
                            <span className="text-hcMuted tracking-wider font-bold">ИСТОЩАТЬ БУСТЕРЫ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-hcDark p-1.5 rounded transition-colors bg-black/20 border border-hcBorder/20">
                            <input type="checkbox" checked={roomOptions?.depleteWeapons ?? true} onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteWeapons', !(roomOptions?.depleteWeapons ?? true))} className="accent-hcYellow" />
                            <span className="text-hcMuted tracking-wider font-bold">ИСТОЩАТЬ ОРУЖИЕ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-hcDark p-1.5 rounded transition-colors bg-black/20 border border-hcBorder/20">
                            <input type="checkbox" checked={roomOptions?.depleteArmor ?? true} onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteArmor', !(roomOptions?.depleteArmor ?? true))} className="accent-hcYellow" />
                            <span className="text-hcMuted tracking-wider font-bold">ИСТОЩАТЬ БРОНЮ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-hcDark p-1.5 rounded transition-colors bg-black/20 border border-hcBorder/20">
                            <input type="checkbox" checked={roomOptions?.depleteStratagems ?? true} onChange={() => RoomActions.updateRoomOption(roomCode, 'depleteStratagems', !(roomOptions?.depleteStratagems ?? true))} className="accent-hcYellow" />
                            <span className="text-hcMuted tracking-wider font-bold">ЛИМИТ СТРАТАГЕМ</span>
                        </label>
                    </div>
                </SteamBox>
            )}`;

opCode = opCode.replace(oldSettings, newSettings);
fs.writeFileSync(pathOp, opCode, 'utf8');

const pathChaos = 'F:/A_SRAN/coop-vs-randomizer/src/components/modes/ChaosMode.jsx';
let chCode = fs.readFileSync(pathChaos, 'utf8');
const pStart = chCode.indexOf('function PlayerCard');
const pEnd = chCode.indexOf('function ItemSlot', pStart);

const newCard = `function PlayerCard({ build, playerName }) {
  return (
    <div className="steam-group-box pt-7 pb-2 px-2 relative min-h-[280px] flex flex-col justify-between shadow-lg bg-hcPanel">
      <div className="absolute top-0 left-0 w-full h-[30px] bg-gradient-to-r from-[var(--steam-border-dark)] to-transparent -z-10 rounded-t border-b border-[var(--steam-border-dark)]"></div>
      <span className="steam-group-box-title flex items-center justify-between w-[calc(100%-8px)] px-2 pb-1 top-1 left-2 gap-4">
           <span className="text-sm uppercase font-black text-white tracking-widest drop-shadow-md truncate">{playerName}</span>
           <span className="text-[10px] text-hcDark bg-hcAccent px-1.5 py-0.5 rounded font-black tracking-widest shadow-sm shrink-0">SLOT 0{build.playerIndex}</span>
      </span>

      <div className="steam-inset-box p-3 flex-1 flex flex-col gap-3 bg-[var(--color-bg-body)]">
          {/* НОВЫЙ PAPER-DOLL LAYOUT */}
          <div className="grid grid-cols-[1fr_auto_1fr] flex-1 gap-2 min-h-[190px]">
             
             {/* Left: Weapons */}
             <div className="flex flex-col gap-2 justify-center w-full">
                 <ItemSlot item={build.primary} label="Primary" />
                 <ItemSlot item={build.secondary} label="Secondary" />
             </div>
             
             {/* Center: Armor */}
             <div className="shrink-0 w-[100px] lg:w-[130px] flex items-stretch mx-1">
                 <ArmorSlot item={build.armor} />
             </div>
             
             {/* Right: Gadgets */}
             <div className="flex flex-col gap-2 justify-center w-full">
                 {build.booster ? (
                      <div className="steam-inset-box flex flex-col items-center justify-start p-1 bg-hcPanel h-[90px] group border-[var(--steam-border-dark)] hover:border-[var(--steam-border-light)] transition-colors hover:z-[60]">
                         <div className="h-14 w-full mb-1 flex items-center justify-center p-0.5 bg-hcDark/50 rounded-sm inset-shadow-sm border border-[var(--steam-border-dark)] overflow-hidden relative">
                             <img src={\`/assets/images/\${build.booster.imageURL}\`} alt={build.booster.name} className="w-full h-full object-contain filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] transform scale-[1.3] group-hover:scale-[1.4] transition-transform" onError={(e) => e.target.style.display = 'none'} />
                         </div>
                         <span className="text-[9px] text-center text-hcMuted uppercase font-bold leading-[1.1] w-full line-clamp-2">{build.booster.name.replace("'", "")}</span>
                      </div>
                 ) : <EmptySlot label="Booster" />}
                 <ItemSlot item={build.grenade} label="Grenade" />
             </div>
          </div>

          <div className="flex flex-col w-full justify-end mt-2 pt-2 border-t border-[var(--steam-border-dark)]/50">
              <div className="grid grid-cols-4 gap-1.5 w-full">
                  {build.stratagems.map((strat, idx) => (
                      <StratagemSlot key={idx} strat={strat} />
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
}

`;

chCode = chCode.substring(0, pStart) + newCard + chCode.substring(pEnd);
fs.writeFileSync(pathChaos, chCode, 'utf8');

console.log('Script executed');

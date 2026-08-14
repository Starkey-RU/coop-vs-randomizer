# AGENTS.md

## Repository Overview
- **Project**: Helldivers 2 Attrition Protocol & Loadout Randomizer (`coop-vs-randomizer`).
- **Stack**: React 19, Vite 8, Tailwind CSS v4, Zustand (`useGameStore`), Firebase Realtime Database.
- **Module System**: ES Modules (`"type": "module"`). Main execution boundary is the `coop-vs-randomizer` folder.

## Essential Developer Commands
Run commands inside `coop-vs-randomizer`:
- `npm run dev`: Start Vite development server.
- `npm run build`: Production build (Vite + `vite-plugin-pwa`). **Always run this** after code modifications to verify syntax and bundle state.

## Architecture & Data Flow
- **Data Source**: `database.json` at root is the source of truth for primaries, secondaries, grenades, armors, boosters, and stratagems.
- **UI Components**:
  - `src/components/modes/`: Game mode entrypoints (`CoopDraft.jsx`, `ChaosMode.jsx`, `RandomPool.jsx`).
  - `src/components/draft/`: Drafting/Loadout UI components (`PoolGrid.jsx`, `DraftSlots.jsx`, `OperationPanel.jsx`).
- **State & Sync**:
  - `src/store/useGameStore.js`: Zustand store for active user ID, host state, active room code, and Firebase listeners.
  - `src/utils/firebase.js`: Firebase DB instance and connection setup.
  - Firebase schema: `rooms/${roomCode}` -> `pool`, `players`, `options`, `history`, `createdAt`, `hostId`.
- **Core Logic & Mechanics**:
  - `src/utils/poolHelpers.js`: Essential utility for draft pool initialization, loadout calculations (`getPlayerBuild`, `getFilledCount`, `getMaxPossibleSlots`), deploy atomic updates, and history snapshot generation (`buildHistorySnapshot`).
  - `src/hooks/useDraft.js`: Handles item claims/unclaims, personal Warbond ownership validation, and Exosuit restriction enforcement.
  - `src/RandomizerEngine.js`: Used for automated Chaos/Random selections.

## Архитектурный Аудит и Технический Долг (Technical Debt & Orchestration)
Текущая кодовая база требует глобального рефакторинга по паттерну "Оркестратор". Проект оброс "горячими заплатками".
При старте новой сессии всегда ориентируйтесь на следующие цели рефакторинга:
1. **Steam2003 UI Kit**: Прекратить плодить дубликаты Tailwind-классов (`steam-dialog-window`, `steam-group-box`, `steam-tab-btn`, `steam-inset-box`). Необходимо вынести их в атомарные UI-компоненты (напр. `<SteamWindow>`, `<SteamButton>`, `<SteamCard>`) в папке `src/components/ui/`.
2. **Инкапсуляция Firebase (RoomActions/GameOrchestrator)**: Бизнес-логика смешана с UI. Компоненты (`ChaosMode`, `OperationPanel`, `DraftSlots`) напрямую делают `update(ref(db), ...)` и меняют локальный стейт. Это нужно вынести в строгие хуки ответа `useRoomSync()` и методы контроллера (`RoomActions.deploy`, `RoomActions.toggleReady`, `RoomActions.kickPlayer`).
3. **Объединение логики пулов**: Логика раскидана между `poolHelpers.js`, `useDraft.js` и `RandomizerEngine.js`. Их нужно свести в инстанс `GameOrchestrator`, который решает, можно ли взять предмет, и сам рассчитывает стейт-машину комнаты (LOBBY -> DRAFTING -> DEPLOYED).
4. **Drop-in / Drop-out (Миграция сессий)**: 
   - **Kick**: Хост должен иметь возможность выкинуть оффлайн-игрока (вернуть его зарезервированные вещи в общий пул `poolHelpers.buildDeployUpdates`).
   - **Drop-in в Random Pool**: При подключении 4-го игрока посреди кампании в ограниченном пуле для него банально не хватит оружия. Требуется реализовать механику `InjectPersonalLoot(uid)`, которая при коннекте вызывает разово `engine._generateRandomPool(count:1)` и "докидывает" лично ему в Firebase-стейт пару стволов с флагом `exclusiveTo: uid`, чтобы "старички" не украли их со стола.
- **Styling / UI (Steam2003 Aesthetic)**: New and updated UI components MUST adhere to the custom "Steam2003" visual aesthetic. Use the existing CSS classes heavily: `steam-dialog-window`, `steam-group-box`, `steam-group-box-title`, `steam-inset-box`, `steam-tab-btn`. Do not use generic modern flat/borderless UI.
- **Chaos Mode Lobby**: Chaos modes (`chaos_random`, `chaos_attrition`) feature a mandatory **Pre-Drop Squad Lobby**. The host can only Deploy/Generate if all connected players have hit `Mark Ready`.
- **Infinite Logistics (`chaos_random`)**: In this mode, the item pool never depletes. Ensure you invoke `engine.reset()` on the `RandomizerEngine` on every deploy.
- **Exosuit Restriction**: Players are restricted to max **1 Exosuit/Vehicle** stratagem in their loadout (enforced via `isExosuit` check).
- **Warbond Ownership**: Players cannot claim items from Warbonds or Superstore items they do not own in their `players[uid].warbonds` map. Locked items display a red-black diagonal stripe overlay in grids.
- **Base Booster Retention**: Base boosters (`spaceoptimization`, `vitalityenhancement`) are defined in `UNDEPLETABLE_BOOSTER_IDS`. They are never removed from the pool upon deploy.
- **Room Lifecycle & GC**: Rooms are NOT deleted when the host or players leave, maintaining history logic for players reconnecting. They persist in Firebase for 5 days. Player disconnections simply mark `online: false` via `onDisconnect()`.
- **Draft Readiness**: `Mark Ready` requires all available equipment slots to be filled (`getFilledCount >= getMaxPossibleSlots`). Clicking an empty slot in `DraftSlots.jsx` should immediately switch the UI tab to that equipment category for faster UX.
- **Strict UI Cleanliness (No Decorative Icons/Fluff)**: DO NOT put decorative icons (emojis, skull icons, lucide icons next to buttons/headers) unless explicitly requested. Keep the UI text-focused, crisp, tactical Steam2003 / VGUI2 without pulsing circles, flashing dots, or visual fluff.

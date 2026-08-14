# 🛡️ Комплексный Технический & Архитектурный Аудит Проекта
**Проект:** Helldivers 2 Attrition Protocol & Loadout Randomizer (`coop-vs-randomizer`)  
**Дата аудита:** 14 августа 2026 г.  
**Стек:** React 19, Vite 8, Tailwind CSS v4, Zustand 5, Firebase Realtime Database (v12), Lucide React, vite-plugin-pwa  

---

## 1. Executive Summary (Резюме Аудита)

Проект представляет собой специализированное веб-приложение (PWA) для организации и синхронизации игровых сессий в **Helldivers 2** с 4 режимами распределения снаряжения (`Chaos Random`, `Chaos Attrition`, `Co-Op Draft`, `Random Pool`). 

### Ключевые достижения текущей кодовой базы:
1. **Функциональное ядро:** Реализованы алгоритмы драфта, фильтрации по варбондам, учету экзоскелетов, веса брони и пассивных навыков.
2. **Аутентичный UI:** Создана кастомная тема **Steam 2003 (VGUI2)** с 3D-бордюрами и переключением тем (Plain / Steam2003 + Light / Dark).
3. **Мобильная адаптация:** Реализована поддержка Touch Target (44px), Popover-меню для сенсорных экранов, адаптивные сетки арсенала.
4. **Синхронизация:** Реалтайм-взаимодействие через Firebase Realtime Database с поддержкой `onDisconnect` и авто-очистки (GC) комнат.

### Главные выявленные зоны риска и технического долга:
1. **Смешение слоев (UI & Business Logic):** Компоненты режимов (`ChaosMode.jsx`, `CoopDraft.jsx`, `RandomPool.jsx`, `DraftSlots.jsx`) напрямую выполняют мутации базы данных `update(ref(db), ...)` в обход единого сервиса оркестрации.
2. **Баг вызова `getMaxPossibleSlots`:** В `OperationPanel.jsx` функция вызывается без `uid`, что приводит к расчетам слотов от `undefined`.
3. **PWA Precache Bloat (145 MB):** В pre-cache PWA попадают 550 файлов (все тяжелые изображения и рендеры), что замедляет первую загрузку и нагружает канал пользователя.
4. **Дублирование инстансов `RandomizerEngine`:** Параллельно создаются независимые инстансы в `RoomActions.js` и `ChaosMode.jsx`.
5. **Захламление корневой директории:** В корне проекта осталось более 8 разовых скриптов миграции и патчинга (`apply_fixes.cjs`, `patch_all.cjs`, `fix_build.cjs` и др.).

---

## 2. Архитектурная карта системы

```mermaid
graph TD
    subgraph Client Layer [UI & Presentation]
        Home[pages/Home.jsx]
        Room[pages/Room.jsx]
        Admin[pages/Admin.jsx]
        Chaos[modes/ChaosMode.jsx]
        Draft[modes/CoopDraft.jsx]
        RPool[modes/RandomPool.jsx]
        UIComp[components/ui/* (Steam2003)]
    end

    subgraph State & Orchestration Layer
        Store[store/useGameStore.js (Zustand)]
        Actions[store/RoomActions.js]
        DraftHook[hooks/useDraft.js]
        Engine[RandomizerEngine.js]
    end

    subgraph Domain & Helpers Layer
        PoolHelp[utils/poolHelpers.js]
        ArmorReg[utils/armorRegistry.js]
        WarbondReg[utils/warbondRegistry.js]
        StoreHelp[utils/superstoreHelpers.js]
        DB[database.json]
    end

    subgraph Infrastructure Layer
        FBDb[(Firebase Realtime Database)]
        VitePWA[Vite + Workbox PWA]
        LocalStorage[(Browser LocalStorage)]
    end

    Home --> Store
    Room --> Chaos
    Room --> Draft
    Room --> RPool
    Chaos --> Store
    Draft --> Store
    RPool --> Store
    Draft --> Actions
    Draft --> DraftHook
    Store --> FBDb
    Actions --> FBDb
    DraftHook --> FBDb
    Actions --> Engine
    Engine --> DB
    PoolHelp --> DB
    Store --> LocalStorage
```

---

## 3. Детальный аудит компонентов и модулей

### 3.1. Управление состоянием и Синхронизация (`src/store/`, `src/hooks/`)
| Модуль | Оценка | Статус | Замечания |
|---|---|---|---|
| `useGameStore.js` | 8/10 | 🟡 Требует оптимизации | Содержит логику подключения, авторизации по UID и GC комнат. В методе `listenToActiveRooms` мутации БД вызываются напрямую внутри листенера. |
| `RoomActions.js` | 7/10 | 🟡 Частично внедрен | Создан как фасад, но функции `deploy`, `initDraft`, `unclaimItem` всё ещё размазаны по UI-компонентам. Инстанцирует собственный `RandomizerEngine`. |
| `useDraft.js` | 8/10 | 🟢 Рабочий | Проверяет Warbond-доступ, лимит экзоскелетов и лимит стратагем. Однако `DraftSlots.jsx` в `handleUnequip` вызывает Firebase напрямую, минуя `unclaimItem`. |

### 3.2. Игровые движки и рандомизация (`src/RandomizerEngine.js`, `src/utils/poolHelpers.js`)
- **`poolHelpers.js`**:
  - `UNDEPLETABLE_BOOSTER_IDS`: корректно защищает базовые бустеры (`hellpodspaceoptimization`, `vitalityenhancement`) от сгорания.
  - **Критический баг вызова:** `getMaxPossibleSlots(pool, playerUid)` в `OperationPanel.jsx:51` вызывается как `getMaxPossibleSlots(pool)` — отсутствует `uid`, из-за чего расчет слотов вычисляется некорректно.
- **`RandomizerEngine.js` & Менеджеры**:
  - В `ItemManager.js` на строках 11 и 14 присутствуют поврежденные комментарии кодировки (`// ??'?%?`).
  - Логика одного экзоскелета и одного рюкзака в `StratagemManager.js` реализована чисто через весовые коэффициенты `rng()`.
  - Очередь FIFO в `BoosterManager.js` предотвращает зацикливание бустеров.

### 3.3. Режимы игры (`src/components/modes/`)
1. **`ChaosMode.jsx`**:
   - Реализовано обязательное лобби готовности (**Pre-Drop Squad Lobby**).
   - В режиме `chaos_random` корректно вызывается `engine.reset(playersArr)`, обеспечивая бесконечную логистику.
   - *Замечание:* UI содержит много инлайн-стилей и разметки, которую следует переиспользовать через `SteamWindow`, `SteamBox`, `SteamInset`.
2. **`CoopDraft.jsx`**:
   - Реализована **Модель 3 (Personalized Union)**: объединение открытых варбондов команды в общий пул.
   - Поддерживается история операций и просмотр лодаутов через `HistoryModal.jsx`.
   - *Замечание:* `handleDeploy` и `handleStartDraft` выполняют прямые мутации БД, их нужно делегировать в `RoomActions`.
3. **`RandomPool.jsx`**:
   - Позволяет настраивать размер отряда и количество миссий в кампании.
   - *Замечание:* Содержит дубликат функции `getPlayerBuild` (строки 41-55) вместо использования `poolHelpers.js`.

### 3.4. Пользовательский интерфейс и Темизация (`src/components/ui/`, `src/index.css`)
- **Steam 2003 (VGUI2)**: Выполнена качественная стилизация бордюров (`inset`/`outset`), шрифтов Tahoma, скроллбаров и заголовков окон.
- **Атомарные компоненты**: Созданы `SteamWindow`, `SteamBox`, `SteamButton`, `SteamInset`. Однако уровень их покрытия в коде составляет ~20-30% (во многих файлах используются сырые Tailwind-классы).
- **ArmorDisplay.jsx**: Отличная реализация отображения веса брони, пассивок и источников получения (Супермагазин, Варбонды).

---

## 4. Матрица проблем и Технического долга

| ID | Область | Критичность | Описание проблемы | Рекомендация по исправлению |
|---|---|---|---|---|
| **BUG-01** | Логика | 🔴 **HIGH** | `getMaxPossibleSlots(pool)` в `OperationPanel.jsx:51` вызывается без аргумента `uid`. | Заменить на `getMaxPossibleSlots(pool, uid)`. |
| **PWA-01** | Перформанс | 🔴 **HIGH** | `vite-plugin-pwa` генерирует precache на 550 файлов (145.1 MB). Пользователь скачивает всю базу картинок при входе. | Настроить `globIgnores` или `runtimeCaching` для картинок в `vite.config.js`. |
| **ARCH-01** | Архитектура | 🟡 **MEDIUM** | Прямые мутации Firebase размазаны по `ChaosMode`, `CoopDraft`, `RandomPool`, `DraftSlots`. | Вынести все операции в методы `RoomActions` (`deploy`, `startDraft`, `burnPool`). |
| **CODE-01** | Чистота кода | 🟡 **MEDIUM** | В `ItemManager.js` битые символы в комментариях; дублирование `getPlayerBuild` в `RandomPool.jsx`. | Очистить кодировку, удалить дубликат и импортировать из `poolHelpers.js`. |
| **ARCH-02** | Синхронизация | 🟡 **MEDIUM** | Два независимых инстанса `RandomizerEngine` (`RoomActions.js` и `ChaosMode.jsx`). | Сделать `RandomizerEngine` синглтоном или хранить в `RoomActions`. |
| **UI-01** | UI Kit | 🟢 **LOW** | Дублирование CSS-классов темы Steam 2003 в обход созданных компонентов `Steam*`. | Провести рефакторинг UI с полной заменой классов на `<SteamBox>`, `<SteamInset>`, `<SteamButton>`. |
| **CLEAN-01** | Структура | 🟢 **LOW** | 8+ временных скриптов миграции в корне (`apply_fixes.cjs`, `patch_all.cjs` и т.д.). | Перенести в папку `scripts/legacy/` или удалить устаревшие. |

---

## 5. Анализ сборки и производительности

Результаты `npm run build`:
```text
vite v8.2.0 building client environment for production...
✓ 1836 modules transformed.
dist/index.html                   0.87 kB │ gzip:   0.46 kB
dist/assets/index-CcVJuH-b.css   63.81 kB │ gzip:  11.40 kB
dist/assets/index-BX_vnVSI.js   564.34 kB │ gzip: 162.83 kB

PWA v1.3.0
precache  550 entries (145107.59 KiB)
```

### Замечания по оптимизации бандла:
1. **Ineffective Dynamic Import:** Предупреждение о динамическом импорте `useGameStore.js` внутри `WarbondSettings.jsx`. Поскольку store уже статически импортируется в большинстве компонентов, динамический импорт не создает отдельного чанка. Следует заменить на обычный статический импорт.
2. **Размер основного JS-чанка (564 kB):** Рекомендуется настроить разделение чанков (code splitting) для страниц `Admin.jsx` и тяжелых словарей данных.

---

## 6. Пошаговая дорожная карта рефакторинга (Actionable Roadmap)

### Фаза 1: Устранение критических багов и оптимизация сборки
- [ ] Исправить вызов `getMaxPossibleSlots(pool, uid)` в `OperationPanel.jsx`.
- [ ] Настроить `vite-plugin-pwa` в `vite.config.js`, чтобы исключить ассеты брони/стратагем из прекэша SW и перевести их на Cache-First / Stale-While-Revalidate по требованию.
- [ ] Исправить статический импорт `useGameStore` в `WarbondSettings.jsx` для устранения варнинга сборщика.
- [ ] Почистить битые комментарии в `ItemManager.js`.

### Фаза 2: Инкапсуляция Firebase (GameOrchestrator / RoomActions)
- [ ] Перенести методы `deploy(roomCode, pool, options, players, mode)`, `startDraft(roomCode, players)`, `resetPool(roomCode)` в `RoomActions.js`.
- [ ] Подключить `RoomActions.injectPersonalLoot` при drop-in подключении нового игрока в середине сессии.
- [ ] В `DraftSlots.jsx` перевести `handleUnequip` на вызов `useDraft().unclaimItem`.

### Фаза 3: Консолидация Steam 2003 UI Kit
- [ ] Заменить повторяющиеся конструкции в `ChaosMode.jsx`, `CoopDraft.jsx`, `RandomPool.jsx`, `HistoryModal.jsx` на компоненты `<SteamWindow>`, `<SteamBox>`, `<SteamInset>`, `<SteamButton>`.
- [ ] Вынести общие элементы карточек игроков и слотов в переиспользуемые атомы.

### Фаза 4: Организация репозитория и документации
- [ ] Структурировать корневые скрипты: переместить вспомогательные скрипты в `scripts/maintenance/`.
- [ ] Обновить `PROJECT_JOURNAL.md` и `PROJECT_CHANGELOG.md` по итогам выполненных улучшений.

---
*Аудит подготовлен для локальной разработки и планирования спринтов рефакторинга.*

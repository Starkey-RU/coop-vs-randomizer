# ARCHITECT PLAN: HD2 Attrition Randomizer - 3 New Modes

> **Date**: 2026-08-05  
> **Stack**: React 19 + Vite 8 + Tailwind v4 + Zustand 5 + Firebase Realtime Database  
> **Current working mode**: Chaos Random Attrition  

---

## 1. Ответы на архитектурные вопросы

---

### Q1.1 — Co-op Attrition: Race Conditions и модель драфта

**Решение: Real-time First-Come-First-Serve с Optimistic Locking через Firebase Transactions.**

Turn-based драфт убивает динамику: 4 человека ждут друг друга, по 4 слота стратагем + оружие + броня + гранаты + бустер = 32 хода минимум. Это мертвый UX.

Вместо этого используем механику **"claim + deploy"**:

1. Игрок кликает на предмет в общем пуле. Клик вызывает `firebase.database().ref(...).transaction()` — атомарная операция.
2. Внутри транзакции: если `item.claimedBy === null`, записываем `claimedBy: uid`. Если уже занято — транзакция возвращает текущее значение (abort), клиент показывает "Уже забрали".
3. Пока игрок не нажал **Deploy**, предмет помечен как `claimed`, но ещё в пуле (визуально затемнён / с аватаркой того, кто забрал).
4. Игрок может **отменить выбор** (unclaim) — `claimedBy` обнуляется, предмет снова доступен.
5. По нажатию **Deploy** — все `claimed` предметы этого игрока удаляются из пула навсегда.

**Почему Firebase Transactions, а не Firestore?**  
Мы уже на Realtime Database. Метод `ref.transaction(currentData => ...)` гарантирует атомарность. Два одновременных клика на один Autocannon? Первый запишет `claimedBy`, второй увидит, что поле не `null`, и откатится. Нет race condition.

**Fallback**: если транзакция падает из-за сетевого сбоя — клиент показывает toast "Connection issue, try again". Retry логика через 500ms.

---

### Q1.2 — Хранение стейта драфта в Firebase до Deploy

Стейт драфта хранится **на уровне пула в Firebase**, а не локально. Каждый предмет в `rooms/CODE/pool/...` имеет поле `claimedBy`:

```
rooms/ABCDE/pool/stratagems/ac8autocannon: {
  id: "ac8autocannon",
  name: "Autocannon",
  slotType: "Weapon+Backpack",
  claimedBy: null           // <-- здесь или uid игрока
}
```

Дополнительно, у каждого игрока в `rooms/CODE/players/{uid}/` хранится объект `draft`:

```
rooms/ABCDE/players/abc123/draft: {
  primary: "ar23liberator",       // ID выбранного
  secondary: null,                // ещё не выбрал
  grenade: "g123thermitegrenade",
  armor: null,
  booster: "deadsprint",
  stratagems: ["ac8autocannon", null, null, null]
}
```

**Зачем дублировать?** Чтобы UI мог быстро показать "что уже выбрал этот игрок" без перебора всего пула. Firebase Realtime DB — это JSON-дерево, плоские запросы дешевле глубоких.

**По нажатию Deploy**:
1. Все предметы с `claimedBy: uid` удаляются из `rooms/CODE/pool/*` (batch update).
2. `players/{uid}/draft` копируется в `players/{uid}/builds/{roundNumber}`.
3. `players/{uid}/draft` обнуляется.
4. `players/{uid}/status` меняется на `deployed`.

---

### Q2.1 — Random Pool Attrition: генерация пула на 12 лодаутов

**Да, это 12-кратный вызов логики Chaos Mode с теми же constraint'ами.**

Алгоритм:

1. Инициализируем `RandomizerEngine` с полной базой.
2. Вызываем `engine.roll(4)` три раза (3 миссии × 4 игрока = 12 лодаутов).
3. Все 12 результатов формируют **Operation Pool** — плоский массив уникальных предметов.
4. Constraint'ы StratagemManager (макс. 1 рюкзак, макс. 1 мех на игрока) соблюдаются на этапе генерации.

**Важный нюанс**: мы НЕ привязываем лодауты к конкретным игрокам на этапе генерации. Мы генерируем 12 "пакетов снаряжения" как пул доступного. Игроки будут разбирать их перед каждой миссией.

**Баланс рюкзаков и мехов**: каждый из 12 пакетов содержит не более 1 рюкзака и не более 1 меха (гарантировано StratagemManager). Но играки могут выбрать пакет с мехом для Mission 1 и пакет без меха для Mission 2 — это их стратегический выбор.

---

### Q2.2 — Деление пула: сразу или помиссионно?

**Решение: помиссионно, с визуальным Overview всех 12 пакетов.**

**UX-flow**:

```
[Operation Pool Overview]   ←  Экран после генерации. Видны все 12 пакетов.
         │                      Игроки видят что их ждет, планируют.
         ▼
[Mission 1: Pick Phase]     ←  Каждый из 4 игроков выбирает 1 из доступных пакетов.
         │                      Используется та же claim-механика из Co-op.
         ▼
[Mission 1: Deployed]       ←  4 пакета забраны. Осталось 8.
         │
         ▼
[Mission 2: Pick Phase]     ←  Игроки выбирают из оставшихся 8 пакетов.
         │
         ▼
[Mission 2: Deployed]       ←  Осталось 4 пакета.
         │
         ▼
[Mission 3: Pick Phase]     ←  Последние 4 пакета — нет выбора, автораздача.
         │
         ▼
[Operation Complete]
```

**Почему помиссионно, а не сразу?**  
Если раздать все сразу — это просто Co-op Draft x3. Теряется элемент неожиданности. А с помиссионной раздачей игроки принимают тактические решения: "взять сейчас мощный пакет или оставить его на финальную миссию?".

**UI**: слева — столбец из 12 карточек (сворачиваемых). Забранные — серые. Доступные — подсвеченные. Твой текущий выбор — обведен рамкой.

---

### Q3.1 — Versus Mode: формат лобби

**Формат: 2v2 (основной) с поддержкой 1v1.**

Helldivers 2 — игра на 4 человека. 2v2 — это полный лобби, разделённый пополам. Каждая команда видит только свои лодауты. 

1v1 — simplified mode для тестирования или дуэлей.

Структура лобби:

```
rooms/CODE/teams: {
  alpha: {
    players: { uid1: {...}, uid2: {...} },
    score: { kills: 0, deaths: 0, objectives: 0 }
  },
  bravo: {
    players: { uid3: {...}, uid4: {...} },
    score: { kills: 0, deaths: 0, objectives: 0 }
  }
}
```

Хост создает лобби → игроки заходят → каждый выбирает команду (Alpha / Bravo) через UI. Хост может перемещать игроков между командами. Максимум 2 на команду. Когда обе команды укомплектованы — кнопка Start.

---

### Q3.2 — Versus: одинаковые или общие пулы?

**Решение: Seed-based Mirror Pools (одинаковые пулы из одного сида).**

У каждой команды СВОЙ пул, но сгенерированный из одного и того же `seed`. Это гарантирует:

- **Честность**: обе команды получают доступ к одинаковому набору предметов.
- **Изоляция**: команда Alpha не может "заблокировать" предмет для Bravo.
- **Простота Firebase**: два отдельных поддерева `rooms/CODE/pools/alpha` и `rooms/CODE/pools/bravo`.

Seed генерируется на хосте при старте и записывается в `rooms/CODE/seed`. Obе стороны используют seeded PRNG (например, `mulberry32` — 5 строк кода) для генерации идентичных пулов.

```js
// Seeded PRNG (mulberry32)
function mulberry32(a) {
    return function() {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
```

Текущие `ItemManager`, `BoosterManager`, `StratagemManager` используют `Math.random()`. Нужно добавить параметр `rng` (функцию-генератор) в конструкторы.

---

### Q3.3 — Versus: подсчёт очков

**Решение: ручной ввод + простая формула.**

HD2 не имеет API для экспорта статистики. Все данные вводятся вручную через UI после каждой миссии.

**Scoring UI**: после каждого раунда хост (или капитан команды) открывает панель Score Entry:

```
┌──────────────────────────────────────┐
│  MISSION 1 RESULTS                   │
│                                      │
│  Team Alpha:                         │
│  ☐ Main Objective Completed  (+100)  │
│  ☐ Side Objectives: [0] [1] [2] [3] │ (+25 каждый)
│  Deaths: [__]                (-10 каждая)
│  Samples Extracted: [__]     (+5 каждый)
│                                      │
│  Team Bravo:                         │
│  ☐ Main Objective Completed  (+100)  │
│  ...                                 │
└──────────────────────────────────────┘
```

**Firebase State Machine для Versus:**

```
rooms/CODE/versus: {
  currentRound: 1,           // 1-3
  scores: {
    alpha: { round1: null, round2: null, round3: null, total: 0 },
    bravo: { round1: null, round2: null, round3: null, total: 0 }
  }
}
```

Это НЕ отдельная state machine — это поддерево в существующей структуре комнаты. Статус комнаты (`rooms/CODE/status`) уже выполняет роль FSM.

**Формула очков** (настраиваемая хостом):

```
total = (mainObjective ? 100 : 0)
      + (sideObjectives * 25)
      - (deaths * 10)
      + (samplesExtracted * 5)
      + (extractionSuccess ? 50 : 0)
```

---

### Q4.1 — Firebase Data Structure: масштабирование

**Текущая структура** (лаконичная, под один режим):

```
rooms/CODE: {
  host, mode, status: "lobby",
  players: { uid: { name, isReady } },
  poolState, currentRoll
}
```

**Новая структура** (универсальная, под все режимы):

```
rooms/CODE: {
  // ── Meta ──
  host: "uid",
  mode: "chaos" | "coop" | "operation" | "versus",
  status: "lobby" | "drafting" | "round_1" | "round_2" | "round_3" | "scoring" | "finished",
  createdAt: timestamp,
  seed: 123456789,          // для versus mirror pools

  // ── Players ──
  players: {
    uid1: {
      name: "Helldiver",
      team: null | "alpha" | "bravo",    // null для co-op modes
      isReady: false,
      status: "idle" | "drafting" | "deployed",
      draft: {                            // текущий незафиксированный выбор
        primary: null,
        secondary: null,
        grenade: null,
        armor: null,
        booster: null,
        stratagems: [null, null, null, null]
      },
      builds: {                           // зафиксированные лодауты по раундам
        round_1: { ... },
        round_2: { ... },
        round_3: { ... }
      }
    }
  },

  // ── Pool ── (общий или per-team)
  pool: {
    primary:    { itemId: { ...itemData, claimedBy: null }, ... },
    secondary:  { ... },
    grenade:    { ... },
    armor:      { ... },
    booster:    { ... },
    stratagems: { ... }
  },

  // ── Operation Mode (Random Pool) ──
  operation: {
    packages: {
      pkg_0:  { primary: {...}, secondary: {...}, ..., claimedBy: null, round: null },
      pkg_1:  { ... },
      ...
      pkg_11: { ... }
    },
    currentMission: 1   // 1, 2, 3
  },

  // ── Versus Mode ──
  versus: {
    teams: {
      alpha: { players: ["uid1","uid2"] },
      bravo: { players: ["uid3","uid4"] }
    },
    pools: {
      alpha: { primary: {...}, secondary: {...}, ... },
      bravo: { primary: {...}, secondary: {...}, ... }
    },
    scores: {
      alpha: {
        round_1: { mainObj: true, sideObj: 2, deaths: 3, samples: 15, extracted: true, total: 155 },
        round_2: null,
        round_3: null,
        grandTotal: 155
      },
      bravo: { ... }
    },
    currentRound: 1
  },

  // ── History (Chaos Mode legacy) ──
  rollHistory: [
    { rollNumber: 1, builds: [...] },
    { rollNumber: 2, builds: [...] }
  ]
}
```

**Ключевые решения**:

1. **`pool` хранится как object (hashmap), не array**. Firebase не поддерживает array push с транзакциями нормально. `pool/stratagems/ac8autocannon` — прямой путь для `transaction()`.

2. **`status` — единый enum-переход** (FSM). Все mode-specific логики проверяют `status`:
   - `lobby` → все режимы, ожидание игроков
   - `drafting` → co-op/operation: фаза выбора
   - `round_1/2/3` → operation/versus: игровая фаза
   - `scoring` → versus: ввод результатов
   - `finished` → все режимы

3. **Versus хранит pools отдельно по командам**, чтобы избежать cross-team interference.

4. **Operation packages — предгенерированные лодауты**, а не россыпь предметов. Игрок забирает пакет целиком.

---

## 2. Архитектура по режимам

---

### 2.1 Chaos Random Attrition (существующий)

```
┌─────────┐    roll()    ┌──────────────────┐    write    ┌──────────┐
│  Host   │ ──────────►  │ RandomizerEngine │ ──────────► │ Firebase │
│  (click)│              │ (local)          │             │ rooms/X/ │
└─────────┘              └──────────────────┘             └────┬─────┘
                                                               │ onValue
                                                         ┌─────▼─────┐
                                                         │ All Players│
                                                         │ (read-only)│
                                                         └───────────┘
```

**Изменения**: нет. Работает как есть. Рефакторинг только для объединения с новым `status` FSM.

---

### 2.2 Co-op Attrition (ручной драфт)

```
┌─────────┐   start     ┌──────────┐   init pool   ┌──────────┐
│  Host   │ ──────────► │ Firebase │ ◄──────────── │ Engine   │
│         │             │ rooms/X/ │               │ (1x gen) │
└─────────┘             └────┬─────┘               └──────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐   ┌──────────┐
        │ Player 1 │  │ Player 2 │   │ Player 3 │
        │  claim() │  │  claim() │   │  claim() │
        │ via txn  │  │ via txn  │   │ via txn  │
        └──────────┘  └──────────┘   └──────────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                      ┌────────────┐
                      │  Deploy    │  (каждый нажимает сам)
                      │  remove    │  (items удаляются из pool)
                      └────────────┘
```

**Новые компоненты**:

| Файл | Назначение |
|------|-----------|
| `src/components/modes/CoopDraft.jsx` | UI страница драфта. Отображает общий пул, claimed-статусы, кнопку Deploy |
| `src/components/draft/PoolGrid.jsx` | Сетка предметов одной категории (primary / stratagems / etc) |
| `src/components/draft/DraftSlots.jsx` | "Лодаут" игрока — 8 слотов с drag-from-pool или click-to-fill |
| `src/hooks/useDraft.js` | Хук: claim/unclaim через `ref.transaction()`, deploy через batch `update()` |
| `src/utils/poolHelpers.js` | `initPoolFromDatabase(db)` — конвертирует array→object hashmap для Firebase |

**Constraint'ы в UI**:

- Слот Primary показывает только `pool/primary` не-claimed предметы.
- Слот Stratagem 1-4: если уже есть рюкзак в drafted набо — стратагемы с `slotType: "Backpack"` становятся disabled.
- Аналогично для Vehicle — максимум 1.
- Эти constraint'ы проверяются **и на клиенте** (UI disable), **и в transaction** (серверная валидация через current value check).

---

### 2.3 Random Pool Attrition (Операции на 3 миссии)

```
┌─────────┐   generate   ┌──────────────────┐   write 12 pkgs   ┌──────────┐
│  Host   │ ──────────►  │ RandomizerEngine │ ────────────────► │ Firebase │
│ (start) │              │ roll(4) x3       │                   │ operation│
└─────────┘              └──────────────────┘                   └────┬─────┘
                                                                     │
                              ┌───────────────────────────────┐      │
                              │  Mission 1: Pick Phase        │◄─────┘
                              │  4 из 12 пакетов доступны     │
                              │  Каждый игрок claim-ит 1 pkg  │
                              └──────────────┬────────────────┘
                                             ▼
                              ┌───────────────────────────────┐
                              │  Mission 2: Pick Phase        │
                              │  4 из 8 пакетов доступны      │
                              └──────────────┬────────────────┘
                                             ▼
                              ┌───────────────────────────────┐
                              │  Mission 3: Auto-assign       │
                              │  Последние 4 — нет выбора     │
                              └───────────────────────────────┘
```

**Новые компоненты**:

| Файл | Назначение |
|------|-----------|
| `src/components/modes/OperationMode.jsx` | Контейнер: overview пакетов + навигация по миссиям |
| `src/components/operation/PackageCard.jsx` | Карточка одного лодаут-пакета (свернутая / развернутая) |
| `src/components/operation/MissionPhase.jsx` | UI фазы выбора для одной миссии |
| `src/hooks/useOperation.js` | Хук: generatePackages(), claimPackage(pkgId), advanceMission() |

**Генерация пакетов (`useOperation.generatePackages`)**:

```js
function generatePackages(database) {
  const engine = new RandomizerEngine(database);
  const packages = [];
  
  for (let mission = 0; mission < 3; mission++) {
    const result = engine.roll(4);  // 4 билда
    result.builds.forEach((build, idx) => {
      packages.push({
        id: `pkg_${mission * 4 + idx}`,
        ...build,
        claimedBy: null,
        forMission: null    // заполняется при claim
      });
    });
  }
  return packages;
}
```

**Status transitions для Operation**:

```
lobby → drafting (Mission 1 Pick) → round_1 → drafting (Mission 2 Pick) → round_2 → drafting (Mission 3 auto) → round_3 → finished
```

В Firebase `status` принимает значения: `lobby`, `pick_1`, `round_1`, `pick_2`, `round_2`, `pick_3`, `round_3`, `finished`.

---

### 2.4 Versus Mode

```
┌─────────┐  create   ┌──────────┐  join + pick team  ┌──────────────┐
│  Host   │ ────────► │ Firebase │ ◄──────────────── │ Players x4   │
│         │           │ lobby    │                    │ Alpha / Bravo│
└─────────┘           └────┬─────┘                    └──────────────┘
                           │ host starts
                           ▼
                    ┌──────────────┐
                    │ Seed → PRNG  │
                    │ gen pools x2 │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌────────────────┐       ┌────────────────┐
     │  Pool Alpha    │       │  Pool Bravo    │
     │  (mirror seed) │       │  (mirror seed) │
     └───────┬────────┘       └───────┬────────┘
             │                        │
     ┌───────▼────────┐       ┌───────▼────────┐
     │ Alpha drafts   │       │ Bravo drafts   │
     │ (co-op style)  │       │ (co-op style)  │
     └───────┬────────┘       └───────┬────────┘
             │                        │
             └──────────┬─────────────┘
                        ▼
               ┌────────────────┐
               │ PLAY MISSION   │
               │ (in HD2 game)  │
               └───────┬────────┘
                        ▼
               ┌────────────────┐
               │ Score Entry    │
               │ by team cap    │
               └───────┬────────┘
                        ▼
               ┌────────────────┐
               │ Scoreboard     │
               │ + Next Round   │
               └────────────────┘
```

**Новые компоненты**:

| Файл | Назначение |
|------|-----------|
| `src/components/modes/VersusMode.jsx` | Контейнер versus: team lobby → draft → play → score |
| `src/components/versus/TeamLobby.jsx` | Выбор команды Alpha/Bravo |
| `src/components/versus/TeamDraft.jsx` | Драфт (Co-op style) но только из своего team pool |
| `src/components/versus/ScoreEntry.jsx` | Ввод результатов миссии |
| `src/components/versus/Scoreboard.jsx` | Таблица очков по раундам |
| `src/hooks/useVersus.js` | Хук: joinTeam(), generateMirrorPools(seed), submitScore() |
| `src/utils/seededRandom.js` | `mulberry32(seed)` — детерминированный PRNG |

**Видимость данных в Firebase**:

Оба пула хранятся в Firebase, но **UI фильтрует**:
- Игрок Team Alpha видит `rooms/CODE/versus/pools/alpha` — полный доступ.
- `rooms/CODE/versus/pools/bravo` — НЕ показывается в UI (хотя технически доступен).

> **Замечание**: Firebase Realtime Database не поддерживает per-node security rules на уровне команд без серверного кода. Для MVP это допустимо — данные скрыты на уровне UI. Если нужна реальная изоляция — переезжаем на Firebase Security Rules с кастомными claims или Cloud Functions. Это Phase 2.

---

## 3. Рефакторинг RandomizerEngine

Текущий `RandomizerEngine` намертво привязан к `Math.random()` через `ItemManager`, `BoosterManager`, `StratagemManager`. Для Versus Mode нужен seeded PRNG.

### Изменения:

**`src/utils/seededRandom.js`** (новый файл):

```js
export function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function createRng(seed = null) {
  if (seed !== null) return mulberry32(seed);
  return Math.random;    // без сида — стандартный рандом
}
```

**`src/utils/random.js`** — добавить поддержку injectable rng:

```js
// Вместо:
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Станет:
export function randomInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function shuffle(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

**`ItemManager`, `BoosterManager`, `StratagemManager`** — принимают `rng` в конструкторе:

```js
class ItemManager {
  constructor(databaseArray, rng = Math.random) {
    this.pool = [...databaseArray];
    this.rng = rng;
  }
  pick() {
    if (this.pool.length === 0) return null;
    const index = randomInt(0, this.pool.length - 1, this.rng);
    return this.pool.splice(index, 1)[0];
  }
}
```

**`RandomizerEngine`** — принимает `seed`:

```js
class RandomizerEngine {
  constructor(database, seed = null) {
    this.database = database;
    this.rng = createRng(seed);
    this.reset();
  }
}
```

---

## 4. Полная структура проекта (после реализации)

```
coop-vs-randomizer/
├── src/
│   ├── App.jsx                          # Router: добавить /room/:id/draft, /room/:id/versus
│   ├── main.jsx
│   ├── index.css
│   │
│   ├── RandomizerEngine.js              # [MODIFIED] +seed support
│   ├── ItemManager.js                   # [MODIFIED] +rng param
│   ├── BoosterManager.js                # [MODIFIED] +rng param
│   ├── StratagemManager.js              # [MODIFIED] +rng param
│   │
│   ├── store/
│   │   ├── useGameStore.js              # [MODIFIED] +status FSM, +team support
│   │   └── useScoreStore.js             # [NEW] Versus scoring state
│   │
│   ├── hooks/
│   │   ├── useDraft.js                  # [NEW] claim/unclaim/deploy via transactions
│   │   ├── useOperation.js              # [NEW] operation flow: gen packages, claim, advance
│   │   └── useVersus.js                 # [NEW] team join, mirror pools, score submit
│   │
│   ├── pages/
│   │   ├── Home.jsx                     # [MODIFIED] mode selection UI на create
│   │   └── Room.jsx                     # [MODIFIED] mode router: renders different mode components
│   │
│   ├── components/
│   │   ├── modes/
│   │   │   ├── ChaosMode.jsx            # [EXISTING/REFACTOR] текущий UI chaos attrition
│   │   │   ├── CoopDraft.jsx            # [NEW] co-op draft mode container
│   │   │   ├── OperationMode.jsx        # [NEW] random pool operation container
│   │   │   └── VersusMode.jsx           # [NEW] versus mode container
│   │   │
│   │   ├── draft/                       # [NEW] shared draft UI components
│   │   │   ├── PoolGrid.jsx             # Grid предметов (для co-op draft & versus draft)
│   │   │   ├── DraftSlots.jsx           # Слоты лодаута игрока
│   │   │   └── ItemCard.jsx             # Карточка одного предмета (claimed/available/locked)
│   │   │
│   │   ├── operation/                   # [NEW]
│   │   │   ├── PackageCard.jsx          # Карточка лодаут-пакета
│   │   │   └── MissionPhase.jsx         # Фаза выбора миссии
│   │   │
│   │   ├── versus/                      # [NEW]
│   │   │   ├── TeamLobby.jsx            # Выбор Alpha/Bravo
│   │   │   ├── TeamDraft.jsx            # Драфт в рамках команды
│   │   │   ├── ScoreEntry.jsx           # Ввод очков после миссии
│   │   │   └── Scoreboard.jsx           # Таблица результатов
│   │   │
│   │   └── shared/                      # [NEW] переиспользуемые компоненты
│   │       ├── PlayerList.jsx           # Список игроков в лобби
│   │       ├── StatusBar.jsx            # Прогресс-бар пулов
│   │       ├── DeployButton.jsx         # Кнопка Deploy с confirm
│   │       └── PhaseIndicator.jsx       # Индикатор текущей фазы (lobby → drafting → round)
│   │
│   ├── utils/
│   │   ├── firebase.js                  # [EXISTING] firebase config
│   │   ├── random.js                    # [MODIFIED] +rng injection
│   │   ├── seededRandom.js              # [NEW] mulberry32, createRng
│   │   └── poolHelpers.js              # [NEW] array→hashmap, constraint checks
│   │
│   └── themes/
│       └── ...                          # existing theme files
│
├── database.json
├── ARCHITECT_QUESTIONS.md
├── ARCHITECT_PLAN.md                    # ← этот файл
├── PROJECT_JOURNAL.md
├── package.json
└── vite.config.js
```

---

## 5. Firebase Security Rules (рекомендация)

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        // Любой аутентифицированный (или с uid) может читать комнату
        ".read": true,
        
        // Только хост может менять status и seed
        "status": {
          ".write": "data.parent().child('host').val() === auth.uid || !data.exists()"
        },
        
        // Игрок может менять только свою ноду
        "players": {
          "$uid": {
            ".write": "$uid === auth.uid || data.parent().parent().child('host').val() === auth.uid"
          }
        },
        
        // Pool items — transaction write для claim
        "pool": {
          "$category": {
            "$itemId": {
              "claimedBy": {
                ".write": true,
                // Можно claim только если null ИЛИ если unclaim своего
                ".validate": "(newData.val() === null) || (data.val() === null && newData.val() === auth.uid)"
              }
            }
          }
        }
      }
    }
  }
}
```

> **Примечание**: сейчас проект использует анонимные uid из localStorage (не Firebase Auth). Для правил выше нужен хотя бы `signInAnonymously()`. Это можно добавить позже — на MVP правила не блокируют.

---

## 6. Road Map (пошаговый план реализации)

---

### Phase 0: Подготовка фундамента (1-2 дня)

**Цель**: рефакторинг без добавления новых режимов. Все существующее продолжает работать.

| # | Задача | Файлы | Критерий готовности |
|---|--------|-------|-------------------|
| 0.1 | Создать `src/utils/seededRandom.js` с `mulberry32` и `createRng` | новый файл | Unit-тест: два вызова с одним seed дают одинаковую последовательность |
| 0.2 | Рефакторить `random.js` — добавить `rng` параметр в `randomInt` и `shuffle` | `utils/random.js` | Существующий код не ломается (rng = Math.random по умолчанию) |
| 0.3 | Рефакторить `ItemManager`, `BoosterManager`, `StratagemManager` — добавить `rng` в конструкторы | 3 файла | Chaos mode работает как раньше |
| 0.4 | Рефакторить `RandomizerEngine` — принимает `seed` | 1 файл | `new RandomizerEngine(db)` работает как раньше, `new RandomizerEngine(db, 42)` даёт детерминированный результат |
| 0.5 | Создать `src/utils/poolHelpers.js` — `arrayToHashmap(arr)`, `hashmapToArray(obj)`, `initPoolForFirebase(database)` | новый файл | Конвертация database.json array → Firebase-friendly object с `claimedBy: null` |
| 0.6 | Обновить `useGameStore.js` — расширить `createRoom` для приёма `mode`, обновить `status` enum | `store/useGameStore.js` | `createRoom("chaos")` работает как раньше |
| 0.7 | Обновить `Room.jsx` — режим-маршрутизатор: по `roomData.mode` рендерит разные компоненты | `pages/Room.jsx` | Chaos mode — старый UI. Остальные — заглушки "Coming soon" |

---

### Phase 1: Co-op Attrition Mode (3-4 дня)

**Цель**: полностью рабочий режим ручного драфта.

| # | Задача | Файлы | Критерий готовности |
|---|--------|-------|-------------------|
| 1.1 | Создать хук `useDraft.js` — `claimItem(category, itemId)`, `unclaimItem(category, itemId)`, `deploy()` | `hooks/useDraft.js` | Transaction тест: два клиента, один предмет → один получает, второй нет |
| 1.2 | Создать `ItemCard.jsx` — 3 состояния: `available` (кликабельный), `claimed-by-me` (подсвечен), `claimed-by-other` (затемнён + аватар) | `components/draft/ItemCard.jsx` | Визуально различимые 3 состояния |
| 1.3 | Создать `PoolGrid.jsx` — сетка `ItemCard` для одной категории | `components/draft/PoolGrid.jsx` | Рендерит primary pool из Firebase realtime |
| 1.4 | Создать `DraftSlots.jsx` — мой лодаут: 8 слотов (primary, secondary, grenade, armor, booster, strat×4) | `components/draft/DraftSlots.jsx` | Клик на слот → подсветка категории в PoolGrid. Клик на item → заполняет слот |
| 1.5 | Создать `CoopDraft.jsx` — контейнер: PoolGrid + DraftSlots + DeployButton + PlayerList с их draft статусами | `components/modes/CoopDraft.jsx` | Полный flow: lobby → drafting → все deployed → round_1 |
| 1.6 | Реализовать constraint'ы: макс 1 Backpack stratagem, макс 1 Vehicle stratagem | `hooks/useDraft.js` | При попытке claim второго рюкзака — отказ с toast |
| 1.7 | Реализовать "All Deployed" detection: когда все игроки status="deployed", хост видит кнопку "Next Round" или "Finish" | `CoopDraft.jsx`, `useGameStore.js` | Автоматический переход состояния |
| 1.8 | Deploy: batch update — удалить claimed items из pool, сохранить build в `players/{uid}/builds/round_N` | `hooks/useDraft.js` | После deploy предметы исчезают из пула для всех |
| 1.9 | Тестирование: 2-4 вкладки браузера, одновременный драфт | — | Нет race conditions, нет дублей |

---

### Phase 2: Random Pool Attrition / Operation Mode (2-3 дня)

**Цель**: операции на 3 миссии с предгенерированным пулом.

| # | Задача | Файлы | Критерий готовности |
|---|--------|-------|-------------------|
| 2.1 | Создать хук `useOperation.js` — `generatePackages()`, `claimPackage(pkgId)`, `advanceMission()` | `hooks/useOperation.js` | 12 пакетов генерируются на хосте, записываются в Firebase |
| 2.2 | Создать `PackageCard.jsx` — свернутая (иконки) / развернутая (полный лодаут) карточка | `components/operation/PackageCard.jsx` | Клик → expand. Показывает все 8 предметов пакета |
| 2.3 | Создать `MissionPhase.jsx` — UI выбора пакета для текущей миссии | `components/operation/MissionPhase.jsx` | Показывает только доступные пакеты. Claim через transaction |
| 2.4 | Создать `OperationMode.jsx` — контейнер: overview + mission phases + auto-advance | `components/modes/OperationMode.jsx` | Полный flow: gen → pick_1 → round_1 → pick_2 → round_2 → pick_3 → round_3 → finished |
| 2.5 | Mission 3 auto-assign: если осталось ровно 4 пакета и 4 игрока — случайная раздача | `hooks/useOperation.js` | Последние пакеты раздаются автоматически |
| 2.6 | Operation Overview: timeline/stepper UI показывающий "мы на миссии 2 из 3" | `OperationMode.jsx` | Визуальный progress indicator |

---

### Phase 3: Versus Mode (3-4 дня)

**Цель**: 2v2 с mirror pools и scoring.

| # | Задача | Файлы | Критерий готовности |
|---|--------|-------|-------------------|
| 3.1 | Создать `TeamLobby.jsx` — выбор команды Alpha/Bravo, drag-n-drop (хост) | `components/versus/TeamLobby.jsx` | Игроки распределяются по командам. Старт только при 2+2 (или 1+1) |
| 3.2 | Создать хук `useVersus.js` — `joinTeam(team)`, `generateMirrorPools(seed)`, `submitScore(team, roundData)` | `hooks/useVersus.js` | Два пула из одного seed — идентичны |
| 3.3 | Обновить `Room.jsx` — versus flow через `roomData.versus.currentRound` | `pages/Room.jsx` | Корректная маршрутизация по фазам versus |
| 3.4 | Создать `TeamDraft.jsx` — co-op draft но ограниченный team pool | `components/versus/TeamDraft.jsx` | Игрок видит только pool своей команды |
| 3.5 | Создать `ScoreEntry.jsx` — форма ввода: main obj, side obj count, deaths, samples, extraction | `components/versus/ScoreEntry.jsx` | Ввод данных → запись в Firebase `versus/scores` |
| 3.6 | Создать `Scoreboard.jsx` — таблица: Alpha vs Bravo, по раундам, с total | `components/versus/Scoreboard.jsx` | Real-time обновление. Winner highlight |
| 3.7 | Реализовать multi-round flow: draft → play → score → repeat x3 → final scoreboard | `VersusMode.jsx` | 3 раунда подряд без перезагрузки |
| 3.8 | Формула очков — настраиваемая хостом в лобби (presets: Standard, Hardcore) | `useVersus.js`, `TeamLobby.jsx` | Хост выбирает preset или кастомизирует веса |

---

### Phase 4: Polish & QA (1-2 дня)

| # | Задача |
|---|--------|
| 4.1 | Responsive UI: все компоненты корректно на мобилке (4 игрока = 4 телефона) |
| 4.2 | Disconnect handling: если игрок отключился mid-draft → его claims автоматически unclaim через 60s |
| 4.3 | Toast notifications: "Player X claimed Autocannon", "Player Y deployed", "Team Alpha submitted score" |
| 4.4 | Sound effects: claim click, deploy confirm, round transition |
| 4.5 | Cleanup bug (known issue from PROJECT_JOURNAL.md): проверить что StrictMode не удаляет комнаты |
| 4.6 | God Mode (от bingo-app): добавить админ-панель для просмотра и очистки versus rooms |

---

## 7. Риски и узкие места

| Риск | Вероятность | Импакт | Mitigation |
|------|------------|--------|------------|
| **Firebase Realtime DB latency на transactions** | Средняя | Высокий — UX "тормозит" при claim | Optimistic UI: показываем claimed сразу, откатываем если transaction failed |
| **Concurrent claims (> 4 players spam clicking)** | Низкая | Средний | Transaction гарантирует атомарность. Debounce клики (300ms) на клиенте |
| **Firebase free tier limits** (100 simultaneous connections, 1GB storage) | Средняя | Критический | Мониторинг usage. Cleanup old rooms (TTL 24h). При необходимости → Blaze plan |
| **Seeded PRNG divergence** — разные платформы дают разный float | Низкая | Высокий — versus unfair | Генерация ТОЛЬКО на хосте. Клиенты получают готовый pool из Firebase, не генерируют сами |
| **StrictMode double-mount** (React 18/19) | Уже случился | Высокий | Ref-guard: `const mounted = useRef(false)` в cleanup effects |
| **Нет Firebase Auth** — uid из localStorage можно подделать | Высокая | Средний (для MVP допустимо) | Phase 2: `signInAnonymously()`. Не блокирует MVP |
| **Большой payload в Firebase** — 12 полных лодаутов с вложенными объектами | Низкая | Низкий | Flatten structure. Хранить только ID, resolve на клиенте из локальной базы |

---

## 8. Приоритетная рекомендация

**Начинай с Phase 0 → Phase 1 (Co-op Attrition).**

Причины:
1. Co-op Draft — фундамент для всех остальных режимов. `useDraft.js`, `PoolGrid`, `ItemCard`, transaction-логика — переиспользуется в Operation и Versus.
2. Operation Mode — это "Co-op Draft но хост предгенерирует пакеты". 70% кода из Phase 1.
3. Versus Mode — это "Co-op Draft x2 + Scoring UI". 60% кода из Phase 1.

Не делай Versus первым — он самый сложный и зависит от draft-инфраструктуры.

---

*Документ подготовлен на основе анализа кодовой базы: `RandomizerEngine.js`, `ItemManager.js`, `BoosterManager.js`, `StratagemManager.js`, `useGameStore.js`, `database.json` и `PROJECT_JOURNAL.md`.*

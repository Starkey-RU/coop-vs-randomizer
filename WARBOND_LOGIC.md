# WARBOND_LOGIC.md --- Asymmetric Warbond Ownership in Co-op Attrition

> **Date**: 2026-08-06  
> **Context**: Extends ARCHITECT_PLAN.md (2026-08-05)  
> **Problem**: Players in a shared lobby have different Warbond purchases. The single shared pool model breaks down.

---

## 1. Problem Statement

Currently, `database.json` contains ~300 items across 6 categories (primary, secondary, grenade, booster, armor, stratagems). All items are in one flat global pool. Every player sees and can claim everything.

New reality: Helldivers 2 gates items behind Warbond purchases. Player A might own "Steeled Veterans" + "Cutting Edge", while Player B has only the base game. If we throw everything into one pool, Player B will see items they literally cannot equip in-game.

### Three Candidate Models

| Model | Pool Rule | Problem |
|-------|-----------|---------|
| **Intersection** | Only items ALL players own | Punishes buyers. 1 free-to-play player nukes the entire premium pool. Lobby of 4 reduces to ~40% of content. |
| **Union** | All items ANY player owns | Player B gets assigned a Sickle they don't own. Can't equip it. Loadout is dead on arrival. |
| **Personalized Union** | Union pool, but each player can only claim items they own | Best of both worlds. Premium items become "exclusive lanes" for their owners. |

**Decision: Model 3 --- Personalized Union with Ownership-Gated Claims.**

---

## 2. Mathematical Model

### 2.1 Definitions

Let:
- `P = {p1, p2, p3, p4}` --- set of players in a lobby
- `W = {base, warbond1, warbond2, ..., warbondN}` --- set of all Warbond tiers
- `O(p)` --- the **ownership set** of player `p`, a subset of `W`. Every player implicitly owns `base`.
- `I(w)` --- set of all items belonging to Warbond `w`
- `I_total = Union(I(w)) for all w in W` --- entire item database

**Player's item universe** (what a player "has access to"):

```
U(p) = Union( I(w) ) for all w in O(p)
```

Example:
```
O(player_A) = {base, warbond3, warbond5}
O(player_B) = {base}

U(player_A) = I(base) ∪ I(warbond3) ∪ I(warbond5)
U(player_B) = I(base)
```

### 2.2 Pool Generation

When the host starts a Co-op Attrition draft, the **room pool** is generated as:

```
RoomPool = Union( U(p) ) for all p in P
         = Union( I(w) ) for all w in Union( O(p) ) for all p in P
```

In plain English: the room pool contains every item that **at least one player** in the lobby owns.

This is computationally equivalent to:

```
ActiveWarbonds = O(p1) ∪ O(p2) ∪ O(p3) ∪ O(p4)
RoomPool = Union( I(w) ) for all w in ActiveWarbonds
```

### 2.3 Claim Eligibility (The Core Rule)

For any item `i` in the `RoomPool`, and any player `p`:

```
CanClaim(p, i) = (warbondCode(i) ∈ O(p)) AND (i.claimedBy === null)
```

A player can claim an item if and only if:
1. The item's Warbond is in the player's ownership set, AND
2. The item hasn't been claimed by anyone else

### 2.4 Visibility Rules

Every player sees the **entire** RoomPool. But items are rendered in 3 visual states:

| State | Condition | Visual |
|-------|-----------|--------|
| **Available** | `CanClaim(p, i) === true` | Full color, clickable |
| **Locked (not owned)** | `warbondCode(i) ∉ O(p)` | Dimmed + lock icon + Warbond badge. Tooltip: "Requires [Warbond Name]" |
| **Claimed (by other)** | `i.claimedBy !== null && i.claimedBy !== p.uid` | Greyed out + claimer's avatar |
| **Claimed (by me)** | `i.claimedBy === p.uid` | Highlighted border, in my draft slots |

**Why show locked items instead of hiding them?**
- Players see what they're missing. Social pressure: "Dude, buy Steeled Veterans, you're missing the Adjudicator."
- Pool size stays consistent across all screens --- no confusion about "why does Player A see 12 primaries but I see 8?"
- Locked items are context --- they show what the pool could be.

### 2.5 Attrition Rules

When player `p` deploys (finalizes their loadout):

```
For each item `i` in p.draft:
    Remove i from RoomPool entirely
```

Key: **attrition is universal**. When Player A deploys a Warbond-exclusive Sickle, it's gone from the pool for everyone. The fact that only Player A could have claimed it is irrelevant post-deploy --- the item is consumed.

This means Warbond-exclusive items have a hidden strategic value: they're "safe picks" for their owner --- no one else can race you for them. But they still deplete the overall pool variety.

### 2.6 Edge Cases

**Edge Case 1: All premium items are claimed, base player has fewer options**

This is *intentional* and *fair*. The base player's U(p) is a strict subset of the RoomPool. All base items are still available to them (unless claimed by someone else for the base items they share). Premium players have more pool breadth, but base items are contested equally.

**Edge Case 2: A Warbond item is the last item in a category**

If the only remaining primary weapon is from Warbond5, and Player B doesn't own Warbond5, Player B cannot pick any primary. The pool is exhausted *for them* in that category.

Mitigation: The randomizer engine already over-provisions pools. With ~50 primaries, this scenario requires 49 to be depleted first. Practically impossible in a 4-player, 3-round operation (12 primaries consumed max).

**Edge Case 3: A player has zero items available in a category**

This can only happen if `O(p) = {base}` AND every base item in that category was already claimed. The UI shows "No items available" with a suggestion to unlock more Warbonds. Deploy is still allowed with null in that slot (same as current behavior when pool is empty).

---

## 3. Warbond Registry (Config-Driven, Scalable)

### 3.1 The Warbond Config File

New file: `src/data/warbondRegistry.js`

This is the **single source of truth** for all Warbond metadata. Adding a new Warbond = adding one object to this array. No code changes needed elsewhere.

```js
// src/data/warbondRegistry.js
export const WARBOND_REGISTRY = [
  {
    code: "none",
    name: "Base Game / Super Store",
    shortName: "Base",
    icon: "base_icon.webp",
    color: "#4A90D9",        // for UI badges
    releaseOrder: 0,
    isDefault: true           // every player owns this
  },
  {
    code: "warbond1",
    name: "Helldivers Mobilize",
    shortName: "Mobilize",
    icon: "warbond1_icon.webp",
    color: "#E8A838",
    releaseOrder: 1,
    isDefault: false
  },
  {
    code: "warbond2",
    name: "Steeled Veterans",
    shortName: "Steeled",
    icon: "warbond2_icon.webp",
    color: "#7B8794",
    releaseOrder: 2,
    isDefault: false
  },
  {
    code: "warbond3",
    name: "Cutting Edge",
    shortName: "Cutting",
    icon: "warbond3_icon.webp",
    color: "#00BFFF",
    releaseOrder: 3,
    isDefault: false
  },
  {
    code: "warbond4",
    name: "Democratic Detonation",
    shortName: "Detonation",
    icon: "warbond4_icon.webp",
    color: "#FF4444",
    releaseOrder: 4,
    isDefault: false
  },
  {
    code: "warbond5",
    name: "Viper Commandos",
    shortName: "Vipers",
    icon: "warbond5_icon.webp",
    color: "#2ECC71",
    releaseOrder: 5,
    isDefault: false
  },
  {
    code: "warbond6",
    name: "Freedom's Flame",
    shortName: "Flame",
    icon: "warbond6_icon.webp",
    color: "#FF8C00",
    releaseOrder: 6,
    isDefault: false
  },
  {
    code: "warbond7",
    name: "Polar Patriots",
    shortName: "Polar",
    icon: "warbond7_icon.webp",
    color: "#87CEEB",
    releaseOrder: 7,
    isDefault: false
  },
  {
    code: "warbond8",
    name: "Truth Enforcers",
    shortName: "Truth",
    icon: "warbond8_icon.webp",
    color: "#DAA520",
    releaseOrder: 8,
    isDefault: false
  },
  {
    code: "warbond9",
    name: "Urban Legends",
    shortName: "Urban",
    icon: "warbond9_icon.webp",
    color: "#9370DB",
    releaseOrder: 9,
    isDefault: false
  },
  {
    code: "warbond10",
    name: "Killzone",
    shortName: "Killzone",
    icon: "warbond10_icon.webp",
    color: "#B22222",
    releaseOrder: 10,
    isDefault: false
  },
  {
    code: "warbond11",
    name: "Servants of Freedom",
    shortName: "Servants",
    icon: "warbond11_icon.webp",
    color: "#CD853F",
    releaseOrder: 11,
    isDefault: false
  },
  {
    code: "warbond12",
    name: "Exo Experts",
    shortName: "Exo",
    icon: "warbond12_icon.webp",
    color: "#4169E1",
    releaseOrder: 12,
    isDefault: false
  }
];

// Helper: get default ownership set (just base game)
export function getDefaultOwnership() {
  return WARBOND_REGISTRY
    .filter(w => w.isDefault)
    .map(w => w.code);
}

// Helper: get all warbond codes
export function getAllWarbondCodes() {
  return WARBOND_REGISTRY.map(w => w.code);
}
```

### 3.2 Adding `warbondCode` to database.json

Every item in `database.json` gets a new field: `"warbondCode": "none" | "warbond1" | ... | "warbond12"`

Example diff for primary weapons:

```jsonc
// BEFORE
{ "id": "las16sickle", "name": "Sickle", "imageURL": "...", "tags": [...] }

// AFTER
{ "id": "las16sickle", "name": "Sickle", "imageURL": "...", "tags": [...], "warbondCode": "warbond3" }
```

Items from the base game / Super Store get `"warbondCode": "none"`.

**Migration script**: `add_warbonds.cjs` --- a one-time Node script that reads `database.json`, adds `warbondCode` to each item based on a lookup table (manually curated from the HD2 wiki), and writes back. The lookup table is ~300 lines of `{ itemId: warbondCode }` mappings.

### 3.3 New Scalability Guarantee

When Arrowhead releases Warbond 13 ("Night Shift" or whatever):

1. Add 1 entry to `WARBOND_REGISTRY` (5 lines)
2. Add new items to `database.json` with `"warbondCode": "warbond13"`
3. Done. No logic changes. No new components. The settings panel auto-populates from the registry, the pool filter auto-includes the new code.

---

## 4. Firebase State Structure Changes

### 4.1 Player Warbond Ownership (persisted locally + synced to room)

Warbond ownership is stored in **two places**:

**A) localStorage** (persistent across sessions, survives page reload):

```
localStorage key: "hd2_warbond_ownership"
value: ["none", "warbond3", "warbond5"]   // JSON-serialized array
```

**B) Firebase room node** (synced when joining a room):

```
rooms/CODE/players/uid1: {
  name: "Helldiver",
  isReady: false,
  status: "idle",
  ownedWarbonds: ["none", "warbond3", "warbond5"],   // <-- NEW
  draft: { ... },
  builds: { ... }
}
```

**Why both?** localStorage is the source of truth for "what do I own" --- it persists even without a room. Firebase is for room-scoped sharing: other players' clients need to know your ownership to compute the union pool and render lock icons.

### 4.2 Room-Level Computed Warbond Union

When all players are ready and the host clicks Start, the host's client computes:

```
rooms/CODE/activeWarbonds: ["none", "warbond3", "warbond5", "warbond7"]
```

This is the `Union(O(p))` for all players. It's written once at room start and is immutable for the session. This prevents mid-draft ownership changes from corrupting the pool.

### 4.3 Pool Items with Warbond Metadata

Each item in the Firebase pool now carries its `warbondCode`:

```
rooms/CODE/pool/primary/las16sickle: {
  id: "las16sickle",
  name: "Sickle",
  warbondCode: "warbond3",       // <-- NEW  
  claimedBy: null
}
```

**Why store warbondCode in the pool (denormalized) instead of looking it up from the local DB?**  
Because the Firebase `onValue` listener gives us the pool state. If we need to determine claimability, we'd have to cross-reference `pool[itemId].warbondCode` against `players[myUid].ownedWarbonds`. If warbondCode is already on the pool item, the check is O(1) per item with no secondary lookup.

### 4.4 Full Updated Firebase Schema

```
rooms/CODE: {
  host: "uid",
  mode: "coop",
  status: "drafting",
  createdAt: timestamp,
  seed: 123456789,

  // NEW: room-level warbond union (computed at start, immutable)
  activeWarbonds: ["none", "warbond3", "warbond5", "warbond7"],

  players: {
    uid1: {
      name: "Helldiver_A",
      isReady: true,
      status: "drafting",
      ownedWarbonds: ["none", "warbond3", "warbond5"],   // <-- NEW
      draft: {
        primary: "las16sickle",
        secondary: null,
        grenade: null,
        armor: null,
        booster: null,
        stratagems: [null, null, null, null]
      },
      builds: { ... }
    },
    uid2: {
      name: "Helldiver_B",
      ownedWarbonds: ["none", "warbond7"],                // <-- DIFFERENT
      ...
    }
  },

  pool: {
    primary: {
      las16sickle: {
        id: "las16sickle",
        name: "Sickle",
        warbondCode: "warbond3",      // <-- NEW
        claimedBy: null
      },
      ar23liberator: {
        id: "ar23liberator",
        name: "Liberator",
        warbondCode: "none",          // base game item
        claimedBy: "uid2"
      },
      ...
    },
    secondary:  { ... },
    grenade:    { ... },
    armor:      { ... },
    booster:    { ... },
    stratagems: { ... }
  }
}
```

---

## 5. Algorithm: Pool Generation (Host-Side)

When the host clicks "Start Draft", the following runs on the host's client:

```
FUNCTION generatePool(database, players):
  
  // Step 1: Compute union of all owned warbonds
  activeWarbonds = new Set()
  FOR EACH player IN players:
    FOR EACH code IN player.ownedWarbonds:
      activeWarbonds.add(code)
  
  // Step 2: Filter database to only include items from active warbonds
  pool = {}
  FOR EACH category IN ["primary", "secondary", "grenade", "armor", "booster", "stratagems"]:
    pool[category] = {}
    FOR EACH item IN database[category]:
      IF item.warbondCode IN activeWarbonds:
        pool[category][item.id] = {
          ...item,
          claimedBy: null
        }
  
  // Step 3: Write to Firebase atomically
  firebase.ref(`rooms/${roomCode}/pool`).set(pool)
  firebase.ref(`rooms/${roomCode}/activeWarbonds`).set(Array.from(activeWarbonds))
  firebase.ref(`rooms/${roomCode}/status`).set("drafting")
```

**Complexity**: O(N) where N = total items in database. With ~300 items, this is instant.

---

## 6. Algorithm: Claim Validation (Transaction-Level)

The existing `claimItem` transaction from ARCHITECT_PLAN.md gets one additional check:

```
FUNCTION claimItem(roomCode, category, itemId, myUid, myOwnedWarbonds):

  ref = firebase.ref(`rooms/${roomCode}/pool/${category}/${itemId}`)
  
  ref.transaction(currentData => {
    IF currentData === null:
      RETURN                              // item doesn't exist, abort
    
    IF currentData.claimedBy !== null:
      RETURN                              // already claimed, abort
    
    // NEW: Warbond ownership check
    IF currentData.warbondCode NOT IN myOwnedWarbonds:
      RETURN                              // player doesn't own this warbond, abort
    
    currentData.claimedBy = myUid
    RETURN currentData                    // commit
  })
```

**Security note**: `myOwnedWarbonds` is passed from the client. A malicious player could lie about their ownership. For MVP, this is acceptable (same trust model as current uid-from-localStorage). For hardening:
- Option A: Firebase Security Rules that read `players/{uid}/ownedWarbonds` and cross-check during `.validate`
- Option B: Cloud Function that validates ownership before writing claims

Firebase Security Rule (Option A):

```json
"pool": {
  "$category": {
    "$itemId": {
      "claimedBy": {
        ".validate": "
          (newData.val() === null) || 
          (
            data.val() === null && 
            newData.val() === auth.uid &&
            root.child('rooms').child($roomId).child('players').child(auth.uid)
              .child('ownedWarbonds').child(
                root.child('rooms').child($roomId).child('pool').child($category).child($itemId).child('warbondCode').val()
              ).exists()
          )
        "
      }
    }
  }
}
```

> This rule is complex. For MVP, client-side validation is sufficient. Players are friends in a lobby, not adversaries.

---

## 7. UI Architecture: Settings Panel

### 7.1 Warbond Settings Panel (Main Page, Pre-Lobby)

Location: `src/components/settings/WarbondSettings.jsx`

Renders on the **Home page** (before creating/joining a room). Persists to localStorage.

```
┌─────────────────────────────────────────────────────┐
│  YOUR WARBONDS                              [Done]  │
│                                                     │
│  ✅ Base Game / Super Store          (always on)    │
│                                                     │
│  ☐ Helldivers Mobilize               🟡             │
│  ☐ Steeled Veterans                  ⚪             │
│  ✅ Cutting Edge                     🔵             │
│  ☐ Democratic Detonation             🔴             │
│  ✅ Viper Commandos                  🟢             │
│  ☐ Freedom's Flame                   🟠             │
│  ☐ Polar Patriots                    🩵             │
│  ☐ Truth Enforcers                   🟤             │
│  ☐ Urban Legends                     🟣             │
│  ☐ Killzone                          🔴             │
│  ☐ Servants of Freedom               🟤             │
│  ☐ Exo Experts                       🔵             │
│                                                     │
│  [Select All]                    [Deselect All]     │
│                                                     │
│  You own 3 of 13 tiers.                             │
│  Items available: 147 of 298                        │
└─────────────────────────────────────────────────────┘
```

**UX details**:
- Base Game checkbox is always checked and disabled (non-toggleable)
- Each Warbond row shows its color badge (from registry)
- "Items available: X of Y" updates live as checkboxes toggle
- State persists to `localStorage.hd2_warbond_ownership`
- A gear icon on the Home page opens this panel (slide-out drawer or modal)

### 7.2 Lobby Warbond Overview

When in a lobby (before draft starts), each player's Warbond ownership is visible:

```
┌─────────────────────────────────────────┐
│  LOBBY: ABCDE                           │
│                                         │
│  👤 Helldiver_A     🔵🟢               │
│     Base + Cutting Edge + Vipers        │
│                                         │
│  👤 Helldiver_B     (base only)         │
│     Base                                │
│                                         │
│  👤 Helldiver_C     🔵🔴🟠             │
│     Base + Cutting + Detonation + Flame │
│                                         │
│  Pool preview: 213 items from 5 tiers   │
│                                         │
│  [Start Draft]  (host only)             │
└─────────────────────────────────────────┘
```

Each player's Warbond badges are rendered as small colored dots. On hover/tap: tooltip with full names.

---

## 8. Draft UI with Warbond States

### 8.1 ItemCard Warbond Enhancement

The existing `ItemCard.jsx` (from ARCHITECT_PLAN Phase 1.2) gets a fourth visual state:

```
src/components/draft/ItemCard.jsx

Props:
  - item: { id, name, warbondCode, claimedBy, ... }
  - isOwned: boolean (derived from player's ownedWarbonds)
  - myUid: string

Computed state:
  IF item.claimedBy === myUid        → STATE: "claimed-by-me"
  ELSE IF item.claimedBy !== null    → STATE: "claimed-by-other"  
  ELSE IF !isOwned                   → STATE: "locked-warbond"
  ELSE                               → STATE: "available"

Render:
  "available"       → full opacity, cursor:pointer, onClick → claimItem()
  "claimed-by-me"   → gold border, my avatar, onClick → unclaimItem()
  "claimed-by-other" → opacity:0.4, other player's avatar overlay
  "locked-warbond"  → opacity:0.3, 🔒 icon, warbond color badge in corner
                      tooltip: "Requires {warbondName}", cursor:not-allowed
```

### 8.2 Pool Filtering/Sorting Options

The PoolGrid component gets filter controls:

```
[Show: All ▼]  [Sort: Category ▼]

Filter options:
  - All items          (default --- shows locked items too)
  - My items only      (hides items I don't own)
  - Available only     (hides locked + claimed-by-other)

Sort options:
  - Category (default)
  - Warbond tier
  - Name A-Z
```

"My items only" is a convenience filter for players who don't want visual noise from locked items. The default ("All") is recommended for the social/discovery aspect.

---

## 9. Data Flow Diagram

```
┌──────────────────────┐
│   MAIN PAGE          │
│                      │
│  WarbondSettings     │──── saves ────► localStorage
│  (toggle checkboxes) │               "hd2_warbond_ownership"
│                      │                    │
│  [Create Room]       │                    │
└──────────┬───────────┘                    │
           │ createRoom()                   │
           ▼                                │
┌──────────────────────┐                    │
│   LOBBY              │                    │
│                      │    reads           │
│  On join: write      │◄──────────────────┘
│  ownedWarbonds to    │
│  Firebase player node│
│                      │
│  All players' owned  │
│  warbonds visible    │
│                      │
│  [Start Draft]       │
└──────────┬───────────┘
           │ host clicks start
           ▼
┌──────────────────────────────────────────────────────┐
│   HOST: generatePool()                               │
│                                                      │
│   1. Read all players' ownedWarbonds from Firebase   │
│   2. Compute activeWarbonds = Union(all ownership)   │
│   3. Filter database.json → only activeWarbond items │
│   4. Write pool to Firebase (items + warbondCode)    │
│   5. Write activeWarbonds to Firebase                │
│   6. Set status = "drafting"                         │
└──────────┬───────────────────────────────────────────┘
           │ onValue triggers on all clients
           ▼
┌──────────────────────────────────────────────────────┐
│   DRAFT PHASE (all players)                          │
│                                                      │
│   Each client:                                       │
│   1. Reads pool from Firebase (realtime listener)    │
│   2. Reads own ownedWarbonds from localStorage       │
│   3. For each item, computes:                        │
│      isOwned = item.warbondCode ∈ myOwnedWarbonds    │
│   4. Renders ItemCard with appropriate state          │
│   5. On click → claimItem transaction (with check)   │
│   6. On deploy → standard attrition (remove items)   │
└──────────────────────────────────────────────────────┘
```

---

## 10. Impact on Existing Modes

### 10.1 Chaos Random Attrition (existing)

**Change**: The randomizer engine now filters items by the player's `ownedWarbonds` before rolling. Solo mode = only your owned items appear.

```
// Before
const engine = new RandomizerEngine(database);

// After 
const filteredDB = filterDatabaseByWarbonds(database, myOwnedWarbonds);
const engine = new RandomizerEngine(filteredDB);
```

### 10.2 Co-op Attrition (new, primary target)

Fully described above. Personalized Union model.

### 10.3 Operation Mode (Random Pool)

Same as Co-op but the 12 pre-generated packages only include items from `activeWarbonds`. Each player can only be assigned a package where ALL items are in their ownership set.

**Additional constraint**: Package assignment validation:

```
CanClaimPackage(player, package) = 
  FOR ALL items i IN package:
    warbondCode(i) ∈ O(player)
```

If a package contains even one item the player doesn't own, they can't claim it. This is more restrictive than Co-op (where you pick items individually).

**Mitigation**: When generating packages, the engine should prefer base-game items for "universally claimable" packages, and create Warbond-specific packages only when needed. Alternatively: tag packages with their "minimum required Warbonds" and show this in the UI.

### 10.4 Versus Mode

Each team's mirror pool is filtered by the **team's** Warbond union:

```
AlphaPool = filterByWarbonds(database, O(alpha_player1) ∪ O(alpha_player2))
BravoPool = filterByWarbonds(database, O(bravo_player1) ∪ O(bravo_player2))
```

Note: with asymmetric team ownership, mirror pools may differ in size. This is fair --- teams chose their players knowing their collective Warbond access.

If strict fairness is required, fall back to intersection:

```
SharedWarbonds = AlphaTeamWarbonds ∩ BravoTeamWarbonds
AlphaPool = BravoPool = filterByWarbonds(database, SharedWarbonds)
```

This is a host-configurable option: "Versus Pool Rule: [Team Union] / [Fair Intersection]".

---

## 11. File Architecture (New/Modified Files)

```
src/
├── data/
│   └── warbondRegistry.js              [NEW]  Warbond definitions, colors, helpers
│
├── components/
│   ├── settings/
│   │   └── WarbondSettings.jsx         [NEW]  Checkbox panel, localStorage read/write
│   │
│   ├── lobby/
│   │   └── PlayerWarbondBadges.jsx     [NEW]  Color dots + tooltip per player
│   │
│   └── draft/
│       └── ItemCard.jsx                [MODIFIED] +locked-warbond state, +warbond badge
│
├── utils/
│   ├── warbondHelpers.js               [NEW]  filterDatabaseByWarbonds(), 
│   │                                          computeActiveWarbonds(),
│   │                                          isItemOwnedByPlayer()
│   └── poolHelpers.js                  [MODIFIED] initPoolForFirebase() now includes
│                                                  warbondCode in each pool item
│
├── hooks/
│   ├── useWarbondOwnership.js          [NEW]  Read/write localStorage, sync to Firebase
│   └── useDraft.js                     [MODIFIED] claimItem() adds warbondCode check
│
├── store/
│   └── useGameStore.js                 [MODIFIED] createRoom writes activeWarbonds,
│                                                  player node includes ownedWarbonds
│
└── pages/
    └── Home.jsx                        [MODIFIED] Add gear icon → WarbondSettings
```

### 11.1 Key New Utility Functions

```
// src/utils/warbondHelpers.js

filterDatabaseByWarbonds(database, ownedWarbondCodes)
  → Returns a new database object with only items whose warbondCode 
    is in the provided set. Used for solo modes and pool generation.

computeActiveWarbonds(playersMap)
  → Takes Firebase players object, returns Set of all unique warbondCodes 
    across all players. Used by host at draft start.

isItemOwnedByPlayer(item, playerOwnedWarbonds)
  → Boolean check: item.warbondCode ∈ playerOwnedWarbonds.
    Used in ItemCard render logic and claim validation.

getWarbondMeta(warbondCode)
  → Returns { name, color, icon } from WARBOND_REGISTRY.
    Used for UI badges and tooltips.
```

---

## 12. Migration Plan

### Step 1: Tag database.json (1-2 hours, manual)

Add `warbondCode` to every item in `database.json`. This requires cross-referencing each item ID with the Helldivers 2 wiki to determine which Warbond it belongs to.

Create `add_warbonds.cjs`:
```js
const WARBOND_MAP = {
  // Primary
  "ar23liberator": "none",
  "las16sickle": "warbond3",
  "br14adjudicator": "warbond2",
  "sg225iebreakerincendiary": "warbond2",
  "plas1scorcher": "warbond3",
  // ... ~300 entries
};
```

### Step 2: Create warbondRegistry.js (30 min)

Copy from Section 3.1 above. Static data.

### Step 3: Create warbondHelpers.js (1 hour)

Pure functions, easily unit-testable.

### Step 4: Create WarbondSettings.jsx (2-3 hours)

UI component. Read/write localStorage. No Firebase dependency.

### Step 5: Integrate into lobby flow (2-3 hours)

Sync ownedWarbonds to Firebase on room join. Show badges in lobby. Compute activeWarbonds on start.

### Step 6: Modify pool generation + claim validation (2-3 hours)

Add warbondCode to pool items. Add ownership check to transaction.

### Step 7: Update ItemCard with locked state (1-2 hours)

Fourth visual state. Warbond badge rendering.

**Total estimate: 1.5-2 days of focused work.**

---

## 13. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **warbondCode mapping errors** --- wrong item assigned to wrong Warbond | Medium | Cross-reference with 2+ wiki sources. Community can report errors via GitHub issues. Fixing = 1 line in database.json. |
| **Pool too small** --- if all players are base-only, pool might feel limited | Low | Base game has ~60% of all items. Still plenty for 4 players x 3 rounds. |
| **Operation Mode package generation fails** --- can't create packages that all players can claim | Medium | Fallback: generate per-player packages (each player gets packages from their own U(p) only). Less "shared pool" feel but always solvable. |
| **New Warbond drops mid-session** --- Arrowhead releases Warbond 13 while users are mid-draft | None | activeWarbonds is frozen at room start. New Warbonds only appear after database.json is updated (manual deploy). |
| **localStorage cleared** --- player loses their Warbond settings | Low | Settings are 12 checkboxes. Quick to re-select. Consider optional "Export/Import settings" or "Select All" button. |
| **Firebase payload bloat** --- warbondCode on every pool item adds ~15 bytes per item | Negligible | 300 items x 15 bytes = 4.5KB. Firebase Realtime DB handles this trivially. |

---

*This document extends ARCHITECT_PLAN.md. Implementation should occur as Phase 0.5 --- after the foundation refactor (Phase 0) but before Co-op Attrition implementation (Phase 1), since Co-op Attrition depends on the Warbond-aware pool generation.*

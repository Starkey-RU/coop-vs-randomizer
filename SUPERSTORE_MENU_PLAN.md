# SUPERSTORE_MENU_PLAN.md --- Visual Armor-Icon Submenu for Superstore Ownership

> **Date**: 2026-08-06  
> **Context**: Extends WARBOND_LOGIC.md, modifies `WarbondSettings.jsx`  
> **Problem**: The current Superstore section in WarbondSettings uses plain text checkboxes. The user wants a dedicated, highly visual submenu where clicking actual armor icons toggles ownership.

---

## 1. Problem Statement

Currently, `WarbondSettings.jsx` (line 94-99) renders the Superstore section as a flat list of text checkboxes via `renderCheckboxList(SUPERSTORE_ITEMS)`. Each entry looks like:

```
☐ Demolition Specialist / Ground Breaker / Devastator
☐ Arctic Ranger / Kodiak / Winter Warrior
...
```

This is bad UX for Superstore items because:
- Players recognize armor sets by their **visual appearance**, not by grouped name strings
- A single checkbox represents 2-3 armor sets (e.g., `warbond6` = Demolition Specialist + Ground Breaker + Devastator), which is confusing
- HD2 players know "I own the Demolition Specialist armor" not "I own warbond6"

**Goal**: Replace the Superstore text-checkbox section with a clickable grid of actual armor icons. One click on an armor icon toggles its underlying `warbondCode` in the `owned` state array.

---

## 2. The Mapping Problem (Critical Design Decision)

### 2.1 How Superstore Data is Structured

In `warbondRegistry.js`, each Superstore entry maps to a **warbondCode** that groups multiple items:

```js
{ code: "warbond6", name: "Demolition Specialist / Ground Breaker / Devastator" }
```

In `database.json`, items with `warbondCode: "warbond6"` span **multiple categories** (primary weapons, armor, etc.). The armor category specifically contains the visual icons we want.

### 2.2 The Core Question: What Does Clicking an Armor Icon Toggle?

**Decision: Clicking ANY armor icon toggles the entire `warbondCode` it belongs to.**

Rationale:
- Ownership in Helldivers 2 is per-purchase, not per-item. You buy a Superstore rotation and get ALL items in that rotation (armor + weapons).
- The `owned` array stores `warbondCode` strings, not individual item IDs.
- If a player clicks the "Demolition Specialist" armor icon, they're saying "I bought this Superstore rotation" --- which also includes the Adjudicator rifle and anything else in `warbond6`.

**Visual consequence**: When `warbond6` is toggled ON, ALL armor icons belonging to `warbond6` light up simultaneously (Demolition Specialist, Ground Breaker, AND Devastator). They are a group.

### 2.3 Mapping Table: warbondCode -> Armor Icons

This mapping is derived at runtime by filtering `database.json`'s `armor` array by each Superstore `warbondCode`. No hardcoded mapping needed.

```
warbond6  -> [Demolition Specialist, Ground Breaker, Devastator]  (3 armors)
warbond7  -> [Arctic Ranger, Kodiak, Winter Warrior]               (3 armors)  
warbond19 -> [Street Scout, Road Block]                            (2 armors)
warbond20 -> [Light Gunner, Heatseeker, Juggernaut]               (3 armors)
warbond21 -> [Exterminator, Drone Master]                          (2 armors)
warbond22 -> [Combat Technician, Dynamo]                           (2 armors)
warbond24 -> [Hell-Bent, Frontier Marshal, Lawmaker]               (3 armors)
warbond25 -> [Democracy's Deputy, Bearer of the Standard]          (2 armors)
warbond26 -> [Grand Juror, Livewire, Bleeding Edge]               (3 armors)
```

Total: ~23 armor icons across 9 groups.

---

## 3. Navigation: How to Enter the Submenu

### 3.1 Entry Point

The current `WarbondSettings.jsx` Superstore section (lines 93-99) gets replaced with a single button/banner that opens the submenu:

```
┌─────────────────────────────────────────────────────┐
│  ЛИЦЕНЗИИ И ДОСТУП                   [Максимум][Сброс]│
│                                                     │
│  --- Стандартные Warbonds ---                        │
│  ☐ Steeled Veterans                                  │
│  ☐ Cutting Edge                                      │
│  ...                                                 │
│                                                     │
│  --- Премиум Статусы (Legendary) ---                │
│  ☐ Super Citizen Status                              │
│  ...                                                 │
│                                                     │
│  --- Ротация Superstore ---                          │
│  ┌─────────────────────────────────────────────┐     │
│  │  🛒 SUPERSTORE: 4 из 9 ротаций куплено      │     │
│  │  [Открыть каталог брони ►]                   │     │  <-- NEW BUTTON
│  └─────────────────────────────────────────────┘     │
│                                                     │
│  [Применить профиль]                                 │
└─────────────────────────────────────────────────────┘
```

### 3.2 Navigation Mechanics

**Option A (Recommended): Inline Expand/Collapse**

The Superstore section expands in-place within the same scrollable panel. No separate route or modal. A `[Открыть каталог ►]` button toggles a `showSuperstoreGrid` boolean state. When expanded, the armor icon grid replaces the button.

Why: Keeps everything in one scroll context. No navigation stack to manage. Steam 2003 panels were inline, not modals-on-modals. The user can still see their Warbond checkboxes above.

**Option B (Alternative): Slide-Over Panel**

A panel slides in from the right, covering WarbondSettings. A back-arrow returns to WarbondSettings. More dramatic visual separation but adds navigation complexity.

**Decision: Option A** for MVP simplicity. The submenu is just a collapsed/expanded section within the existing `WarbondSettings.jsx`.

### 3.3 State Management for Navigation

```jsx
// Inside WarbondSettings.jsx
const [superstoreExpanded, setSuperstoreExpanded] = useState(false);
```

No router changes. No new pages. Pure local state toggle.

---

## 4. UI/UX Design: The Armor Icon Grid

### 4.1 Layout

When expanded, the Superstore section renders a grid of armor icons grouped by `warbondCode`:

```
┌───────────────────────────────────────────────────────────┐
│  РОТАЦИЯ SUPERSTORE                    [◄ Свернуть]       │
│                                                           │
│  ── warbond6: Demolition Specialist Pack ──────────────── │
│  ┌──────┐  ┌──────┐  ┌──────┐                            │
│  │ IMG  │  │ IMG  │  │ IMG  │                            │
│  │      │  │      │  │      │                            │
│  │ ✓    │  │ ✓    │  │ ✓    │    ← all ON (group owned) │
│  │Demol.│  │Ground│  │Devas │                            │
│  └──────┘  └──────┘  └──────┘                            │
│                                                           │
│  ── warbond7: Arctic Ranger Pack ─────────────────────── │
│  ┌──────┐  ┌──────┐  ┌──────┐                            │
│  │ IMG  │  │ IMG  │  │ IMG  │                            │
│  │      │  │      │  │      │                            │
│  │      │  │      │  │      │    ← all OFF (not owned)  │
│  │Arctic│  │Kodiak│  │Winter│                            │
│  └──────┘  └──────┘  └──────┘                            │
│                                                           │
│  ── warbond19: Street Scout Pack ─────────────────────── │
│  ┌──────┐  ┌──────┐                                      │
│  │ IMG  │  │ IMG  │                                      │
│  │      │  │      │                                      │
│  │Street│  │Road  │                                      │
│  └──────┘  └──────┘                                      │
│                                                           │
│  ... (6 more groups)                                      │
└───────────────────────────────────────────────────────────┘
```

### 4.2 Individual Armor Icon Tile: Visual States

Each tile is a square card (~64x64px on mobile, ~80x80px on desktop) with two states:

**State: NOT OWNED (warbondCode not in `owned`)**
```
┌──────────────────┐
│                  │   border: 1px solid (VGUI2 inset style)
│   [armor.webp]   │   border-color: #2a3124 #69745d #69745d #2a3124  (inset/pressed)
│   (desaturated)  │   filter: grayscale(80%) brightness(0.5)
│                  │   opacity: 0.5
│   ─────────────  │
│   Armor Name     │   text: text-gray-500, text-[9px], truncated
└──────────────────┘   cursor: pointer
```

**State: OWNED (warbondCode in `owned`)**
```
┌──────────────────┐
│                  │   border: 2px solid var(--color-hcAccent)  (yellow highlight)
│   [armor.webp]   │   filter: none (full color)
│   (full color)   │   opacity: 1.0
│      ✓           │   checkmark badge: absolute positioned, bottom-right corner
│   ─────────────  │   small green circle with white check
│   Armor Name     │   text: text-hcAccent (yellow), text-[9px]
└──────────────────┘   cursor: pointer
                       optional: subtle glow/shadow from var(--color-hcAccent)
```

**Hover State (both):**
```
border-color brightens slightly
transform: scale(1.05) (subtle zoom)
transition: 150ms ease
```

**Click behavior:**
- Clicking ANY tile in a group toggles the ENTIRE group's `warbondCode`.
- If `warbond6` is not in `owned` -> click any of its 3 tiles -> add `warbond6` to `owned` -> all 3 tiles light up.
- If `warbond6` IS in `owned` -> click any of its 3 tiles -> remove `warbond6` from `owned` -> all 3 tiles dim.

### 4.3 Group Header

Each group gets a thin header row:

```
── [Pack Name] ───── [Toggle All Button: ON/OFF] ──
```

- The group name comes from `SUPERSTORE_ITEMS[i].name` (e.g., "Demolition Specialist / Ground Breaker / Devastator")
- A small toggle button on the right provides a text-based fallback (accessibility)
- Clicking the group header itself also toggles the warbondCode (large click target)

### 4.4 Steam 2003 Theme Compliance

Per `STEAM2003_THEME_DOC.md`:

| Element | Implementation |
|---------|---------------|
| **Panel background** | `theme-inner-panel` class (uses `--color-bg-panel`: `#384030`) |
| **Tile borders (not owned)** | Inverted VGUI2 borders: dark top-left, light bottom-right (sunken/inset look) |
| **Tile borders (owned)** | Standard VGUI2 borders: light top-left, dark bottom-right (raised look) + accent color |
| **Font** | Tahoma/Arial, `text-[9px]` or `text-[10px]`, uppercase, `tracking-wider` |
| **Colors** | Unowned: gray/#d2d2d2. Owned: `--color-text-highlight` (`#ffe589`/yellow) |
| **No border-radius** | Tiles get `rounded-none` or `rounded-sm` max. Steam 2003 had sharp corners |
| **Active/pressed** | On click, invert border colors for 100ms (VGUI2 button press effect) |

### 4.5 Responsive Grid

```
Mobile (< 640px):   grid-cols-3  (tiles 64x64, fits 3 per group row)
Tablet (640-1024px): grid-cols-4  (tiles 72x72)  
Desktop (> 1024px):  grid-cols-5  (tiles 80x80)
```

Groups with 2-3 items will have partial rows. This is fine and visually indicates "this is one rotation pack."

---

## 5. Data Flow: Fetching and Filtering Armor Icons

### 5.1 Data Source

`database.json` is already imported in the app (via `import databaseObj from '../../database.json'` in `useGameStore.js`). The armor category is `databaseObj.armor`.

### 5.2 Filtering Logic (Pure Function)

```
NEW FILE: src/utils/superstoreHelpers.js

FUNCTION getSuperstoreArmorGroups(database, superstoreRegistry):

    INPUT:
        database       = full database.json object
        superstoreRegistry = SUPERSTORE_ITEMS array from warbondRegistry.js

    OUTPUT:
        Array of {
            warbondCode: string,
            groupName: string,
            armors: Array<{ id, name, imageURL, warbondCode }>
        }

    ALGORITHM:
        1. Extract the set of superstore warbond codes:
           superstoreCodes = superstoreRegistry.map(s => s.code)
           // ["warbond6", "warbond7", "warbond19", "warbond20", ...]

        2. Filter database.armor to only superstore items:
           superstoreArmors = database.armor.filter(
               item => superstoreCodes.includes(item.warbondCode)
           )

        3. Group by warbondCode:
           groups = {}
           for (armor of superstoreArmors):
               if !groups[armor.warbondCode]:
                   groups[armor.warbondCode] = []
               groups[armor.warbondCode].push(armor)

        4. Map to output format, preserving registry order:
           return superstoreRegistry.map(entry => ({
               warbondCode: entry.code,
               groupName: entry.name,
               armors: groups[entry.code] || []
           })).filter(g => g.armors.length > 0)  // skip empty groups
```

### 5.3 When to Compute

This data is **static** (database.json doesn't change at runtime). Compute once on component mount via `useMemo`:

```jsx
// Inside SuperstoreSubmenu.jsx
const armorGroups = useMemo(
    () => getSuperstoreArmorGroups(databaseObj, SUPERSTORE_ITEMS),
    []  // empty deps = compute once
);
```

### 5.4 Image URLs

Each armor item has an `imageURL` field like `"demolitionspecialist.webp"`. These images must be served from a known base path.

**Current state**: The existing randomizer UI already renders item images somewhere. Whatever base URL pattern it uses (e.g., `/images/armor/` or a CDN URL), we reuse the same for the Superstore submenu.

**If images are in `/public/`**: `<img src={`/images/armor/${armor.imageURL}`} />`
**If images are external CDN**: `<img src={`https://cdn.example.com/${armor.imageURL}`} />`

> **Action item for implementer**: Grep codebase for existing `imageURL` usage pattern. Match it exactly.

---

## 6. State Sync: Owned Array Integration

### 6.1 Current State Flow

```
localStorage("bingo_owned_warbonds")
        |
        | useEffect (on mount)
        v
    WarbondSettings local state: owned[]
        |
        | toggleWarbond(code)  <- checkbox click
        v
    owned[] updated (React state)
        |
        | handleSave() -> "Применить профиль" button
        v
    localStorage.setItem("bingo_owned_warbonds", JSON.stringify(owned))
```

### 6.2 How SuperstoreSubmenu Integrates

**The submenu does NOT have its own state.** It receives `owned` and `toggleWarbond` as props from the parent `WarbondSettings`:

```jsx
// WarbondSettings.jsx (modified)
{superstoreExpanded ? (
    <SuperstoreSubmenu
        owned={owned}
        onToggle={toggleWarbond}   // same function that checkboxes use
        onCollapse={() => setSuperstoreExpanded(false)}
    />
) : (
    <button onClick={() => setSuperstoreExpanded(true)}>
        Открыть каталог брони ►
    </button>
)}
```

When the user clicks an armor icon:
1. `SuperstoreSubmenu` calls `onToggle("warbond6")`
2. `WarbondSettings.toggleWarbond("warbond6")` runs -> updates `owned` state
3. React re-renders both WarbondSettings and SuperstoreSubmenu
4. All tiles in the `warbond6` group visually update (owned/not-owned)
5. The user clicks "Применить профиль" at the bottom (same button that already exists)
6. `handleSave()` writes the updated `owned` array to localStorage

**No new localStorage keys. No new Zustand state. No new Firebase writes.**

The Superstore submenu is a pure visual layer on top of the existing `warbondCode` toggle system.

### 6.3 Consistency with Text Checkboxes

When the submenu is collapsed, the old text checkboxes for Superstore are HIDDEN (replaced by the "open catalog" button). This prevents dual-state confusion where a checkbox and an icon grid both control the same `warbondCode`.

If the user opens the submenu, toggles some armors, then collapses it --- the `owned` state is already updated. The "Применить профиль" button at the bottom of WarbondSettings saves everything.

---

## 7. Component Architecture

### 7.1 New Files

```
src/
├── components/
│   └── settings/
│       ├── WarbondSettings.jsx        [MODIFIED]  Remove Superstore checkbox section,
│       │                                          add expand/collapse + SuperstoreSubmenu
│       └── SuperstoreSubmenu.jsx      [NEW]       Armor icon grid component
│
└── utils/
    └── superstoreHelpers.js           [NEW]       getSuperstoreArmorGroups() pure function
```

### 7.2 SuperstoreSubmenu.jsx --- Component Contract

```
COMPONENT SuperstoreSubmenu

PROPS:
    owned: string[]            // current owned warbond codes (from parent)
    onToggle: (code) => void   // callback to toggle a warbondCode (from parent)
    onCollapse: () => void     // callback to collapse submenu (from parent)

INTERNAL STATE:
    none (fully controlled component)

COMPUTED (useMemo):
    armorGroups: Array<{warbondCode, groupName, armors[]}>

RENDER:
    <div className="theme-inner-panel">
        <header>
            "РОТАЦИЯ SUPERSTORE"
            <button onClick={onCollapse}>◄ Свернуть</button>
            <SuperstoreQuickActions owned={owned} onToggle={onToggle} />
        </header>

        <div className="grid-container overflow-y-auto max-h-[45vh]">
            {armorGroups.map(group => (
                <ArmorGroup
                    key={group.warbondCode}
                    group={group}
                    isOwned={owned.includes(group.warbondCode)}
                    onToggle={() => onToggle(group.warbondCode)}
                />
            ))}
        </div>

        <footer>
            "{ownedCount} из {totalCount} ротаций куплено"
        </footer>
    </div>
```

### 7.3 ArmorGroup --- Inline Sub-Component (inside SuperstoreSubmenu.jsx)

```
COMPONENT ArmorGroup (not a separate file — too small)

PROPS:
    group: { warbondCode, groupName, armors[] }
    isOwned: boolean
    onToggle: () => void

RENDER:
    <div>
        <header onClick={onToggle} className="cursor-pointer">
            "{group.groupName}"
            <span>{isOwned ? "✓ Куплено" : "✗ Не куплено"}</span>
        </header>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {group.armors.map(armor => (
                <ArmorTile
                    key={armor.id}
                    armor={armor}
                    isOwned={isOwned}
                    onClick={onToggle}
                />
            ))}
        </div>
    </div>
```

### 7.4 ArmorTile --- Inline Sub-Component (inside SuperstoreSubmenu.jsx)

```
COMPONENT ArmorTile (not a separate file)

PROPS:
    armor: { id, name, imageURL }
    isOwned: boolean
    onClick: () => void

RENDER:
    <button
        onClick={onClick}
        className={cn(
            "relative w-16 h-16 sm:w-20 sm:h-20 border-2 transition-all duration-150",
            "flex flex-col items-center justify-center",
            isOwned
                ? "border-hcAccent opacity-100"                    // raised VGUI2
                : "border-gray-600 opacity-50 grayscale"           // sunken VGUI2
        )}
        style={isOwned
            ? { borderColor: '#69745d #2a3124 #2a3124 #69745d' }   // VGUI2 raised
            : { borderColor: '#2a3124 #69745d #69745d #2a3124' }   // VGUI2 sunken
        }
        title={armor.name}
    >
        <img
            src={getArmorImageUrl(armor.imageURL)}
            alt={armor.name}
            className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 object-contain",
                !isOwned && "grayscale brightness-50"
            )}
            loading="lazy"
        />
        {isOwned && (
            <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-600 rounded-full
                            flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">✓</span>
            </div>
        )}
        <span className={cn(
            "text-[8px] sm:text-[9px] uppercase tracking-wide truncate w-full text-center mt-0.5",
            isOwned ? "text-hcAccent" : "text-gray-500"
        )}>
            {armor.name}
        </span>
    </button>
```

---

## 8. Modifications to WarbondSettings.jsx

### 8.1 Diff Summary

```diff
 // Line 1: imports
+import SuperstoreSubmenu from './SuperstoreSubmenu';
+import databaseObj from '../../../database.json';  // or wherever it's imported
 
 // Inside component body, after existing state:
+const [superstoreExpanded, setSuperstoreExpanded] = useState(false);
+
+// Compute superstore count for the summary badge
+const superstoreOwned = SUPERSTORE_ITEMS.filter(s => owned.includes(s.code)).length;

 // Replace lines 93-99 (the Superstore checkbox section) with:

-               {/* Superstore */}
-               <div className="flex flex-col gap-2">
-                   <h3 className="...">Ротация Superstore</h3>
-                   <div className="theme-inner-panel p-3 flex flex-col gap-2 rounded">
-                       {renderCheckboxList(SUPERSTORE_ITEMS)}
-                   </div>
-               </div>

+               {/* Superstore --- Visual Grid */}
+               <div className="flex flex-col gap-2">
+                   <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500
+                                  border-b border-gray-700/50 pb-1">
+                       Ротация Superstore
+                   </h3>
+                   {superstoreExpanded ? (
+                       <SuperstoreSubmenu
+                           owned={owned}
+                           onToggle={toggleWarbond}
+                           onCollapse={() => setSuperstoreExpanded(false)}
+                       />
+                   ) : (
+                       <button
+                           onClick={() => setSuperstoreExpanded(true)}
+                           className="theme-button p-3 flex items-center justify-between
+                                      uppercase text-xs font-bold tracking-wider"
+                       >
+                           <span>🛒 Каталог брони Superstore</span>
+                           <span className="text-hcAccent">
+                               {superstoreOwned}/{SUPERSTORE_ITEMS.length} ►
+                           </span>
+                       </button>
+                   )}
+               </div>
```

### 8.2 selectAll / clearAll Compatibility

The existing `selectAll()` (line 34-41) already includes `SUPERSTORE_ITEMS.map(w => w.code)`. No changes needed. The SuperstoreSubmenu will reflect the state because it reads from the same `owned` prop.

---

## 9. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      WarbondSettings.jsx                         │
│                                                                  │
│  State: owned[] ◄──── localStorage("bingo_owned_warbonds")      │
│         superstoreExpanded (boolean)                              │
│                                                                  │
│  ┌──────────────────────┐   ┌──────────────────────────────────┐│
│  │ Standard Warbonds    │   │ Legendary Warbonds              ││
│  │ (text checkboxes)    │   │ (text checkboxes)               ││
│  │ toggleWarbond(code)  │   │ toggleWarbond(code)             ││
│  └──────────────────────┘   └──────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  superstoreExpanded === false:                               ││
│  │  [🛒 Каталог брони Superstore    3/9 ►]                     ││
│  │                                                             ││
│  │  superstoreExpanded === true:                                ││
│  │  ┌────────────────────────────────────────────────────────┐ ││
│  │  │              SuperstoreSubmenu.jsx                      │ ││
│  │  │                                                        │ ││
│  │  │  Props: owned[], onToggle(), onCollapse()              │ ││
│  │  │                                                        │ ││
│  │  │  useMemo: getSuperstoreArmorGroups(database, registry) │ ││
│  │  │           ↓                                            │ ││
│  │  │  database.json ──filter──► armor items by warbondCode  │ ││
│  │  │           ↓                                            │ ││
│  │  │  ArmorGroup × 9 (one per warbondCode)                  │ ││
│  │  │    └── ArmorTile × 2-3 (one per armor in group)        │ ││
│  │  │         onClick → onToggle(warbondCode)                │ ││
│  │  │         isOwned ← owned.includes(warbondCode)          │ ││
│  │  └────────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Применить профиль] → localStorage.setItem(owned)              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. Image Asset Strategy

### 10.1 Existing Pattern

Items in `database.json` have `imageURL` fields like `"demolitionspecialist.webp"`. We need to find where existing code resolves these to full URLs. Two scenarios:

**Scenario A: Images in `/public/` folder hierarchy**
```
public/
└── images/
    └── armor/
        ├── demolitionspecialist.webp
        ├── arcticranger.webp
        └── ...
```
Resolution: `src={`/images/armor/${armor.imageURL}`}`

**Scenario B: External CDN / GitHub raw**
```
const BASE_URL = "https://raw.githubusercontent.com/.../armor/";
```
Resolution: `src={`${BASE_URL}${armor.imageURL}`}`

> **Action for implementer**: Check how `ChaosMode.jsx` or `PoolGrid.jsx` renders item images. Copy that pattern exactly into `ArmorTile`.

### 10.2 Fallback

If an image fails to load:
```jsx
<img
    src={getArmorImageUrl(armor.imageURL)}
    onError={(e) => { e.target.src = '/images/placeholder_armor.webp' }}
    ...
/>
```

Or use a CSS-only fallback: on error, hide the `<img>` and show the armor name in larger text.

---

## 11. Quick-Select Controls (Superstore-Specific)

Inside the submenu header, add two quick buttons:

```
[Купить все ротации]    [Вернуть все в магазин]
```

These are Superstore-scoped versions of "Select All / Clear All":

```js
const selectAllSuperstore = () => {
    SUPERSTORE_ITEMS.forEach(s => {
        if (!owned.includes(s.code)) {
            onToggle(s.code);  // add each missing code
        }
    });
};

const clearAllSuperstore = () => {
    SUPERSTORE_ITEMS.forEach(s => {
        if (owned.includes(s.code)) {
            onToggle(s.code);  // remove each present code
        }
    });
};
```

**Problem**: `onToggle` is a toggle, not an explicit set/unset. Calling it in a loop may cause React batching issues.

**Better approach**: Pass a `setOwned` setter or a `bulkToggle(codes[], shouldOwn)` prop from WarbondSettings:

```jsx
// WarbondSettings.jsx
const bulkSetOwnership = (codes, shouldOwn) => {
    setOwned(prev => {
        const withoutCodes = prev.filter(c => !codes.includes(c));
        return shouldOwn ? [...withoutCodes, ...codes] : withoutCodes;
    });
};

// Pass to SuperstoreSubmenu:
<SuperstoreSubmenu
    owned={owned}
    onToggle={toggleWarbond}
    onBulkSet={bulkSetOwnership}
    onCollapse={() => setSuperstoreExpanded(false)}
/>
```

---

## 12. File Architecture Summary

```
src/
├── components/
│   └── settings/
│       ├── WarbondSettings.jsx           [MODIFIED]
│       │   - Add superstoreExpanded state
│       │   - Replace Superstore checkbox section with expand/collapse
│       │   - Pass owned + onToggle + onBulkSet to SuperstoreSubmenu
│       │   - Add bulkSetOwnership() helper
│       │
│       └── SuperstoreSubmenu.jsx          [NEW - ~120 lines]
│           - Props: owned, onToggle, onBulkSet, onCollapse
│           - useMemo: getSuperstoreArmorGroups()
│           - Renders: ArmorGroup -> ArmorTile grid
│           - Quick select all / clear all for superstore scope
│           - Owned count footer
│
└── utils/
    ├── warbondRegistry.js                 [NO CHANGES]
    │   - SUPERSTORE_ITEMS array stays as-is
    │   - Provides codes and group names
    │
    └── superstoreHelpers.js               [NEW - ~30 lines]
        - getSuperstoreArmorGroups(database, registry)
        - getArmorImageUrl(imageURL)  (base path resolution)
```

**Total new code**: ~150 lines across 2 new files + ~20 lines of diff to WarbondSettings.

---

## 13. Implementation Order

| Step | Task | Est. Time | Dependencies |
|------|------|-----------|-------------|
| 1 | Create `superstoreHelpers.js` with `getSuperstoreArmorGroups()` | 15 min | database.json + warbondRegistry.js |
| 2 | Verify armor images exist and determine base URL pattern | 15 min | Grep existing image rendering code |
| 3 | Create `SuperstoreSubmenu.jsx` skeleton (grid + tiles, no styling) | 30 min | Step 1 |
| 4 | Apply Steam 2003 VGUI2 styling to tiles (borders, grayscale, accent) | 30 min | STEAM2003_THEME_DOC.md |
| 5 | Modify `WarbondSettings.jsx` (expand/collapse, props, bulkSet) | 20 min | Step 3 |
| 6 | Test: toggle group by clicking icon, verify `owned` syncs | 15 min | Step 5 |
| 7 | Test: "Применить профиль" persists superstore selections | 10 min | Step 6 |
| 8 | Responsive polish (grid-cols breakpoints, tile sizing) | 15 min | Step 4 |

**Total: ~2.5 hours.**

---

## 14. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Missing armor images** --- some `imageURL` values in database.json may not have corresponding files in `/public/` | High | Verify all superstore armor imageURLs exist BEFORE building the UI. Use `check_svgs.cjs` pattern to validate. Add `onError` fallback. |
| **Armor names too long for tiny tiles** --- "Bearer of the Standard" won't fit in 80px | Low | `truncate` CSS class + `title` attribute for hover tooltip. Names are secondary to the visual icon. |
| **warbondCode grouping mismatch** --- a warbondCode might have 0 armors (only weapons) | Low | `filter(g => g.armors.length > 0)` in the helper. Groups with no armors are hidden. The underlying warbondCode is still toggleable via the original "Максимум/Сброс" buttons. |
| **Performance: too many images loading** --- 23 armor images at once | Negligible | `loading="lazy"` on all `<img>`. Images are small webp files (~5-15KB each). Total < 300KB. |
| **Confusing UX: clicking one armor toggles siblings** --- user clicks "Demolition Specialist" and "Ground Breaker" also lights up | Medium | Visual grouping (shared border/background per group) + group header text makes the "these are one purchase" relationship clear. Consider a subtle animation where all tiles in the group flash briefly on toggle. |

---

## 15. Future Extensions (Out of Scope for MVP)

- **Weapon icons below armor icons**: Show all items in a superstore rotation (primary, secondary weapons), not just armor. Makes the "what's in this pack" question immediately visual.
- **Search/filter within submenu**: Type armor name to highlight matching tiles.
- **Drag to bulk-select**: Touch-drag across multiple groups to toggle them on.
- **"What's new" badge**: Mark recently added Superstore rotations with a "NEW" badge based on registry order.

---

*This document is the implementation specification for the Superstore visual submenu. It modifies only the settings UI layer and does not touch Firebase, Zustand store, pool generation, or claim logic. All changes are contained within the settings/ directory + one new utility file.*

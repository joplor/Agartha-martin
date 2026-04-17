# Arctic Alien Capture — Setup & Run Guide

## Project Structure

```
arctic-alien-capture/
├── index.html          ← Open this in browser (via local server)
├── game.js             ← All game logic (Three.js)
├── HOW_TO_RUN.md       ← This file
└── assets/
    ├── alien_a.jpg     ← !! Place IMAGE 1 here (white-hair character = Type-A)
    └── alien_b.jpg     ← !! Place IMAGE 2 here (blonde character  = Type-B)
```

---

## Step 1 — Place the two images

Copy your two provided images into the `assets/` folder and name them exactly:

| File             | Which image                        | Alien type     |
|------------------|------------------------------------|----------------|
| `alien_a.jpg`    | Image 1 — white-hair military look | Type-A Passive |
| `alien_b.jpg`    | Image 2 — blonde character         | Type-B Hostile |

The images are applied as direct texture maps to the **front face** of each alien's head (BoxGeometry face index 4 = +Z).  No editing or resizing needed — Three.js handles scaling automatically.

---

## Step 2 — Run a local server

Due to browser CORS policy, you **cannot** open index.html by double-clicking it — the texture loader will be blocked.  You need a simple local HTTP server.

### Option A — Python (recommended, comes pre-installed on most systems)

```bash
# Navigate to the arctic-alien-capture folder:
cd "path/to/arctic-alien-capture"

# Python 3:
python -m http.server 8080

# Python 2 (older systems):
python -m SimpleHTTPServer 8080
```

Then open: **http://localhost:8080**

### Option B — Node.js

```bash
npx serve .
# or
npx http-server . -p 8080
```

### Option C — VS Code Live Server extension

Right-click `index.html` → **Open with Live Server**

---

## Step 3 — Play

1. Open **http://localhost:8080** in Chrome/Firefox/Edge
2. Click the start screen to lock the mouse (pointer lock)
3. Explore, find aliens, capture them all

---

## Controls

| Input        | Action                                   |
|--------------|------------------------------------------|
| `W A S D`    | Move                                     |
| Mouse        | Look / rotate camera                     |
| `Space`      | Jump                                     |
| `Shift`      | Sprint                                   |
| `Left Click` | Fire cryo beam                           |
| `Esc`        | Release mouse (browser pointer unlock)   |

---

## Capture Mechanic

1. Aim at an alien (crosshair turns active)
2. **Click once** → alien is FROZEN (blue wireframe shell appears, 5-second window)
3. **Click again while frozen** → CAPTURED and added to inventory
4. If you wait too long the alien thaws and escapes

**Max capture range: 15 metres** — shown in the range warning if too far.

---

## Alien Behaviour

| Type   | Image      | Behaviour                            | Color  |
|--------|------------|--------------------------------------|--------|
| Type-A | alien_a.jpg | Passive — flees player on approach  | Blue   |
| Type-B | alien_b.jpg | Hostile — chases player to attack   | Orange |

- Both types **wander randomly** when player is out of range
- Type-B will show a contact warning if it reaches the player
- The **radar panel** (bottom-right) shows distance to the 4 nearest aliens

---

## Win Condition

Capture all 10 aliens (5 Type-A + 5 Type-B).  Win screen shows final score with a replay button.

---

## Technical Notes

- Engine: **Three.js r158** (loaded from CDN, no install)
- No build step, no npm — pure HTML + JS
- Face textures use `THREE.BoxGeometry` material array: image maps to **face index 4 (+Z face)**, which is the alien's front face
- Terrain height is a pure math function (`terrainH`) — no heightmap image required
- All scenery (ice rocks, snow particles, aurora lights) is procedurally generated

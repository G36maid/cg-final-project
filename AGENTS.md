# AGENTS.md

Guidance for OpenCode agents working in this repo.

## Branch: `theme-park`

This branch focuses on **Theme-Park** (黃昏樂園 Dusk Park) — a 3D theme-park hub meta-game built with OGL that integrates four existing sub-games. The other game directories (3D-Pinball, 3D-Tetris, Rubik's-Cube, Roller-Coaster) exist as **sub-game dependencies** and must not be modified in ways that break integration.

## Hard constraint: OGL only, never Three.js

3D rendering must use the vendored **OGL** library exclusively. Do **not** introduce any Three.js dependency (no `three`, `@react-three/fiber`, etc.). The `original-threejs-plan/` directory is read-only reference — do not implement from those docs.

## Repo layout

Monorepo of independent browser games sharing one vendored library. No root `package.json`, no monorepo tooling, no build step.

- `ogl/` — OGL library source (v1.0.11), vendored verbatim. **Do not `npm install`** — it lives in-repo. Modify only if the library itself needs a fix.
- `Theme-Park/` — **Primary project on this branch**. Hub entry: `index.html` → `src/main.js`. See detailed structure below.
- `3D-Pinball/` — Sub-game. Entry: `index.html` → `src/main.js`. Integrated via `?from=hub` URL param.
- `3D-Tetris/` — Sub-game (WIP, no browser entry yet). Has `src/` and `test/`.
- `Roller-Coaster/` — Sub-game. Entry: `index.html` → `main.js` (at project root, not in `src/`).
- `Rubik's-Cube/` — Sub-game. Entry: `index.html` → `src/main.js`.
- `original-threejs-plan/` — Read-only reference. Do not implement from these.
- `spec/` — Course spec (`final-project.md`). Reference only.

Each game project is self-contained; changes to one game do not affect the others.

## Theme-Park structure

```
Theme-Park/
├── index.html              # Hub entry point + HUD + info panel + fade overlay
├── styles.css              # Global styles (HUD, crosshair, menus, loader)
├── plan.md                 # Authority spec (Traditional Chinese) — read before implementing
├── DEVLOG.md               # Dev findings & gotchas — consult before debugging
├── README.md               # Project README
├── ogl/                    # Symlink → ../ogl (DO NOT break this)
└── src/
    ├── main.js             # DuskPark class: game loop, scene init, proximity triggers
    ├── constants.js        # All tunable constants (camera, player, world, colors, lights, facilities, token economy, materials)
    ├── hub/
    │   ├── skybox.js       # Procedural dusk cubemap + skybox mesh
    │   ├── lighting.js     # Point light uniform factory + default textures
    │   ├── player.js       # First-person controller + pointer lock + E/M keys
    │   ├── facilities.js   # 3 buildings + info board, procedural textures
    │   ├── fountain.js     # Central fountain + cubemap reflection water
    │   └── shadow.js       # Shadow mapping (orthographic sun camera)
    ├── shaders/
    │   ├── phong.js        # Phong shader (8 point lights + shadow sampling)
    │   └── skybox.js       # Skybox vertex/fragment shaders
    ├── geometry/
    │   └── ground.js       # Stone floor (procedural texture + UV tile)
    └── meta/
        ├── store.js        # localStorage state persistence (dusk-park-state key)
        ├── hud.js          # HUD updates + celebration screen
        ├── nav.js          # Scene transitions (fade + URL navigation)
        └── hooks.js        # Shared sub-game hooks (payout + back button)
```

## How OGL is imported

Games import the vendored library via **relative paths**, not from an npm package. Depth depends on where the entry file lives:

| Project | Entry depth | Import path |
|---|---|---|
| Theme-Park `src/main.js` | 2 levels | `../../ogl/src/index.js` |
| Theme-Park `src/hub/*.js` | 3 levels | `../../../ogl/src/index.js` |
| Roller-Coaster `main.js` | 1 level | `../ogl/src/index.js` |
| 3D-Pinball/Rubik's-Cube `src/main.js` | 2 levels | `../../ogl/src/index.js` |

Never change these to `import ... from 'ogl'` — there is no installed `node_modules/ogl`.

### Theme-Park's OGL symlink

`Theme-Park/ogl/` is a **symlink** to `../ogl`. This is needed because `plan.md` specifies serving from **repo root** so that sub-game relative paths (`../3D-Pinball/`, etc.) resolve correctly. If you serve `Theme-Park/` alone, the symlink ensures OGL imports work — but `miniserve` must **not** use `--no-symlinks`.

## Running Theme-Park

**Must serve from repo root** so all sub-game relative paths resolve:

```sh
miniserve . -p 8765 --index index.html
```

Then open `http://localhost:8765/Theme-Park/`.

Notes:
- `--index index.html` makes miniserve serve `index.html` when a directory is requested (e.g. `/Theme-Park/` → `Theme-Park/index.html`). Without this flag, directory paths show a file listing instead.
- The repo root has no `index.html`, so miniserve emits a harmless warning (`The file 'index.html' provided for option --index could not be found`) and shows a directory listing at `/`. This is expected — navigate to `/Theme-Park/` to play.
- `--no-symlinks` must **not** be used, as `Theme-Park/ogl/` is a symlink to `../ogl/` which is required for OGL imports to resolve.

No bundler, no transpile, no Vite — pure ES modules loaded directly by the browser.

## Sub-game integration protocol

Sub-games are integrated via **page navigation** (not in-WebGL embedding). The protocol:

1. **Hub → Sub-game**: `location.href = '../3D-Pinball/index.html?from=hub'` (see `meta/nav.js`)
2. **Sub-game detects hub**: Check `?from=hub` URL param via `hooks.isFromHub()`
3. **Back to hub**: `hooks.returnToHub()` → fade transition → `../Theme-Park/index.html`
4. **Token state**: All transactions via `localStorage['dusk-park-state']` (see `meta/store.js`)
5. **Back button**: `hooks.injectBackButton()` injects a styled "↩ 返回樂園" button fixed top-right

### Do not modify sub-game core logic

Only add integration hooks at score/exit points. Sub-game physics and rendering stay untouched.

## Key constants and conventions

- **Token economy**: Defined in `src/constants.js` → `ECONOMY`. Coaster costs 10 tokens, arcade games pay flat 10 tokens each, 3 rides = soft win.
- **Color palette**: Dusk theme — warm orange/gold sun, cool purple sky, neon pink/cyan accents. All in `constants.js` → `COLORS`.
- **Phong shader**: 8 point lights max (`MAX_LIGHTS = 8` in `shaders/phong.js`). Uniforms use base name (no `[0]` suffix) with regular `Array` (not `Float32Array`) — see DEVLOG.
- **State key**: `localStorage` key is `'dusk-park-state'` and must stay consistent across hub and all sub-games.
- **Shadow**: Orthographic sun camera; depth map 2048². Applied via `shadow.js` → rendered before main pass.

## OGL gotchas (from DEVLOG)

- **Skybox**: Do NOT use `mat3(modelViewMatrix)` + `xyww` trick — camera is not at box center in a walkthrough scene. Use standard projection + giant box (500³) with `cullFace: gl.FRONT`, `depthWrite: false`, `frustumCulled = false`.
- **Array uniforms**: Key by base name (`uLightPos`, not `uLightPos[0]`). Value must be a regular `Array`, not `Float32Array` — OGL's `flatten()` expects `Array.isArray()` to return true for array uniforms.
- **OGL render state**: `cullFace: false/null` does NOT disable previously-enabled face culling. Use `cullFace: gl.BACK/FRONT` for reliable state. Default `depthFunc` is `gl.LEQUAL` (not `gl.LESS`). `depthTest: false` moves mesh to UI render group.

## Tests

Tests use **Node's built-in test runner** (`node:test` + `node:assert`). No Jest/Mocha.

| Project | Command |
|---|---|
| Rubik's-Cube | `npm test` (= `node --test tests/*.test.js`) |
| 3D-Tetris | `node --test test/*.test.js` (run from project dir) |

Tests only cover pure-logic modules (state, scoring, grid, notation, solver) — nothing that touches WebGL or the DOM. Theme-Park has no tests.

## General conventions

- **No external physics engine** — all physics is hand-rolled in JS, updating OGL `Transform` nodes directly.
- **No GLTF/model loading pipelines** — geometry is procedurally generated via OGL primitives and custom `Geometry`/`Program`.
- **Plans are authoritative specs**: `plan.md` (Traditional Chinese) defines game design, physics constants, and controls. Consult it before implementing behavior.
- **Code style**: no ESLint/Prettier at root or in Theme-Park. Most projects use 4-space indent, single quotes.
- **Shaders**: GLSL inlined in JS via `/* glsl */` template literals inside OGL `Program` configs.
- **Language**: user-facing strings and docs are in Traditional Chinese; code comments are mixed Chinese/English.
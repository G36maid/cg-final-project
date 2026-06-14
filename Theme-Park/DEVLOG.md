# DevLog — 黃昏樂園開發記錄

開發過程中的技術 finding、踩坑、決策記錄。寫設計文件的 Challenges and Solutions 時可直接引用。

---

## 2026-01-14: Skybox 不渲染 — mat3 + xyww trick 的陷阱

### 現象

Skybox mesh（Box 幾何，500x500x500，cubemap texture）完全不可見。Fragment shader 改為純紅色輸出也看不到任何紅色像素。WebGL 無 error（`gl.getError() = 0`），mesh 的 visible/frustumCulled/renderOrder/program/geometry 全部正確。

### 排除過程

1. 懷疑 frustum culling → 設 `frustumCulled = false`，無效
2. 懷疑 face culling winding → 用 `cullFace: false` + `depthTest: false` + `transparent: true` 極簡化測試 → 紅色滿屏，確認 mesh 能渲染
3. 逐步恢復發現：標準投影（不用 mat3/xyww）+ `cullFace: gl.FRONT` + `depthWrite: false` → 天空漸層正確顯示

### 根因

`mat3(modelViewMatrix)` 去除 translation 後，再用 `gl_Position = pos.xyww`（設 z=w）：

- 相機不在 box 中心時（本例相機在 [0, 1.7, 18]，box 在原點），**相機背後的頂點**（如 +Z 面的頂點在 view space z=250）投影後 w 值為負
- xyww 設 z=w，當 w<0 時，clip test `-w ≤ z ≤ w` 變成 `正值 ≤ 負值 ≤ 負值`，**判定失敗**
- 約一半的 box 頂點被 clip 掉，多數 triangle 被完全剔除，skybox 幾乎不可見

### 解法

不用 mat3/xyww trick。改用：
- 標準投影：`gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0)`
- 巨型 box（500³）固定在 world origin，相機永遠在 box 內部
- `cullFace: gl.FRONT` 渲染 box 內部
- `depthWrite: false` 不影響其他幾何的深度測試
- `frustumCulled = false` 避免 OGL frustum 測試誤判

### 教訓

mat3+xyww skybox 技巧假設相機在 box 中心（或 box 夠大到所有頂點都在前面）。對於漫遊型場景（相機不在原點），標準投影 + 巨型 box 更穩定。

---

## 2026-01-14: OGL import 路徑與 miniserve 服務根目錄

### 現象

`Theme-Park/src/main.js` 的 `import { ... } from '../../ogl/src/index.js'` 在 miniserve 服務 `Theme-Park/` 時，瀏覽器解析為 `http://localhost:port/ogl/src/index.js`，但 miniserve 根目錄是 `Theme-Park/`，`ogl/` 不在裡面 → 404。

### 根因

ES module 的相對 import 路徑被瀏覽器 URL-normalize：
- `/src/main.js` + `../../ogl/...` → `/ogl/...`（`../..` 從 `/src/` 回到 `/` 根）
- 如果 server 根目錄是 `Theme-Park/`，`/ogl/` 對應 `Theme-Park/ogl/`，不存在

### 解法

在 `Theme-Park/` 建 symlink：`ln -sf ../ogl ogl`（與 Roller-Coaster 的做法一致）。

### 注意

miniserve 需移除 `--no-symlinks` flag 才能跟隨 symlink。其他 3 個遊戲（3D-Pinball/Rubik's-Cube/3D-Tetris）沒有 symlink，是從 repo 根目錄服務的。

另外，`miniserve . -p 8765 --index index.html` 會因 repo 根目錄沒有 `index.html` 而發出警告，這是無害的——子目錄如 `/Theme-Park/` 仍會正確回傳其 `index.html`。

---

## OGL 慣例摘要（從 3D-Pinball 提取）

- Import：`import { Renderer, Camera, Transform } from '../../ogl/src/index.js'`（深度依檔案位置調整）
- Renderer：`new Renderer({ dpr: 1, antialias: false })`，canvas 由 OGL 建立（或傳入既有的）
- Camera：`new Camera(gl, { fov, near, far })`，`position.set()` + `lookAt([x,y,z])`
- Scene：`new Transform()` 作為 root，子 mesh 用 `setParent()`
- Loop：`requestAnimationFrame`，`dt = Math.min(0.033, time - lastTime)`
- Shader：`/* glsl */` template literal，`new Program(gl, { vertex, fragment, uniforms })`
- Resize：`renderer.setSize(w, h)` + `camera.perspective({ aspect: w/h })`
- Cubemap：`new Texture(gl, { target: gl.TEXTURE_CUBE_MAP })`，`texture.image = [6 images]`
- OGL Renderer 排序：用 `mesh.renderOrder`（數字越小越先渲染）；分 opaque/transparent/ui 三組

## OGL Program render state 注意

- `cullFace: false/null` → 不啟用 face culling，但也不會 DISABLE 前一個 program 留下的 culling
- `cullFace: gl.BACK/FRONT` → 每次使用該 program 時都會設定（可靠的）
- `depthFunc` 預設 `gl.LEQUAL`（不是 `gl.LESS`）
- `depthTest: false` 會把 mesh 歸類到 UI render group（最後渲染）
- `transparent: true` 歸到 transparent group（opaque 之後）

## 2026-01-14: OGL array uniform 命名陷阱

### 現象

Shader 中宣告 `uniform vec3 uLightPos[8]` 等陣列 uniform，OGL 每幀噴 warning "Active uniform uLightPos[0] has not been supplied"，即使已傳入值。

### 根因

OGL Program.js 解析 active uniform 名稱 `uLightPos[0]` 時，用 `match(/(\w+)/g)` 拆成 `['uLightPos', '0']`：
- `uniformName = 'uLightPos'`（不含 `[0]`）
- `nameComponents = ['0']`

查找時用 `this.uniforms['uLightPos']`。如果 uniforms object 的 key 是 `'uLightPos[0]'`，查不到 → warning。

找到後，nameComponents 處理邏輯用 `Array.isArray(uniform.value)` 判斷是否為陣列 uniform。`Float32Array` 不是 `Array`，`Array.isArray()` 回傳 false → 當作 struct 處理 → 找不到 component → warning。

### 解法

1. Uniform key 用 base name（不含 `[0]`）：`uLightPos` 而非 `'uLightPos[0]'`
2. Value 用 regular `Array`（不用 `Float32Array`）：`[x1,y1,z1, ...]` 而非 `new Float32Array([...])`

OGL 內部會 `flatten()` 並用 `gl.uniform3fv(location, flatArray)` 上傳整個陣列。

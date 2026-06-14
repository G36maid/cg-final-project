# 3D Tetris — OGL

基於 [OGL](https://github.com/oframe/ogl) 的立體俄羅斯方塊，在 10×20×10 的三維網格中進行。方塊沿 Y 軸下落，玩家在 X-Z 平面上平移並繞三軸旋轉；填滿一整個 10×10 水平層即可消除。搭載 Bloom 後處理、粒子特效、幽靈投影與灰階遊戲結束動畫。

> **嚴禁引入任何 Three.js 依賴** — 全部渲染以 OGL 完成，零外部套件。

## 特色

- **三維網格** — 10 (寬) × 20 (高) × 10 (深)，層消除條件為 10×10 = 100 格全滿
- **七種經典方塊** — I / O / T / S / Z / J / L，統一明度配色避免飽和過曝
- **三軸旋轉** — 繞 X / Y / Z 軸各別 90° 旋轉，含 Wall Kick 碰撞修正
- **圓角方塊 SDF Shader** — 透過 Fragment Shader 的 `sdRoundBox` 距離場計算圓角與邊緣光暈，無需額外幾何
- **Bloom 後處理** — 手動 Ping-Pong FBO 多pass實作（亮度閾值 0.6 → 高斯模糊半徑 0.8 → 強度 0.4 加成疊加）
- **粒子系統** — 500 顆 CPU 更新粒子池，硬降落濺射 + 消除爆炸，Additive Blending 發光
- **幽靈投影** — 半透明落地預覽，邊緣 Fresnel 光暈
- **降環特效** — 硬降落落點 0.3s 光環擴散動畫
- **灰階遊戲結束** — 1.5s 去飽和漸變 + 半透明遮罩
- **軌道相機** — 滑鼠拖曳旋轉 / 滾輪縮放，限制不可翻至底部以下

## 執行方式

純 ES Modules，需透過 HTTP 伺服器載入 (`file://` 會被 CORS 擋下)。依 AGENTS.md 規範使用 `miniserve`：

```sh
cd 3D-Tetris
miniserve . --index index.html
```

開啟瀏覽器連到 `http://localhost:8080/`（或 miniserve 指定的埠）。

## 操作

| 按鍵 | 動作 |
| --- | --- |
| `←` `→` | X 軸移動（左右） |
| `↑` `↓` | Z 軸移動（前後） |
| `Space` | 硬降落（直接落到底部） |
| `Q` / `E` | 繞 Y 軸旋轉 90° |
| `W` / `S` | 繞 X 軸旋轉（前翻 / 後翻） |
| `A` / `D` | 繞 Z 軸旋轉 |
| `Shift` | 加速下落 (Soft Drop) |
| `C` | 暫存當前方塊 (Hold) |
| `P` | 暫停 / 繼續 |
| `R` | 重新開始 |

## 計分

| 動作 | 分數 |
| --- | --- |
| 消除 1 層 | 100 × 等級 |
| 消除 2 層 | 300 × 等級 |
| 消除 3 層 | 500 × 等級 |
| 消除 4+ 層 | 800 × 等級 |
| 硬降落 | 落下格數 × 2 |
| 軟降落 | 落下格數 × 1 |

每消 10 層等級 +1，下落間隔 -50ms（初始 1000ms，最低 200ms）。

## 專案結構

```
3D-Tetris/
├── index.html              # DOM HUD (#hud) + Canvas + Module 入口
├── styles.css              # HUD 樣式（霓虹深色主題）
├── plan.md                 # 詳細設計規格（場景/方塊/物理/特效）
└── src/
    ├── main.js             # 整合入口：渲染迴圈、子系統更新、事件接線
    ├── core/
    │   ├── constants.js    # 網格尺寸、顏色、計分、下落速度常數
    │   ├── pieces.js       # 七種方塊的相對座標定義
    │   ├── Piece.js        # 單一方塊：移動、旋轉（含 Wall Kick）、幽靈計算
    │   ├── PieceBag.js     # 7-bag 隨機產生器
    │   ├── Grid.js         # 10×20×10 Uint8Array 網格：碰撞、鎖定、層消除
    │   ├── Score.js        # 計分、等級、下落速度計算
    │   └── Game.js         # 遊戲狀態機：生成→移動→鎖定→消除→遊戲結束
    ├── systems/
    │   ├── Tween.js        # 自訂補間引擎（easeOutCubic 等）
    │   ├── CameraController.js # Orbit 相機封裝，5 視角預設 + tweenToView
    │   ├── Input.js        # 鍵盤輸入（DAS 170ms / ARR 50ms）
    │   └── Gravity.js      # 固定時間步累加器 + Soft Drop 倍率
    ├── render/
    │   ├── shaders.js      # 所有 GLSL（圓角方塊/幽靈/線框/粒子/光環）
    │   ├── GridWireframe.js # 12 條邊線框籠 (gl.LINES)
    │   ├── Floor.js        # 10×10 底部網格線
    │   ├── CornerBars.js   # 4 根垂直發光邊角條
    │   ├── PlacedBlocks.js # 已定位方塊 InstancedMesh（單次 Draw Call）
    │   ├── ActivePiece.js  # 當前方塊 4 Mesh 補間動畫
    │   ├── GhostPiece.js   # 幽靈投影（透明 + Fresnel 邊緣光暈）
    │   ├── Particles.js    # 500 顆 CPU 粒子池 (gl.POINTS, Additive Blend)
    │   ├── DropRing.js     # 硬降落光環（300ms 補間擴散）
    │   └── Scene.js        # 場景管理：同步 Game 狀態至所有渲染物件
    ├── post/
    │   ├── shaders.js      # 後處理 GLSL（亮度提取/高斯模糊/合成/灰階）
    │   └── PostFX.js       # Bloom 管線（Ping-Pong FBO）+ 灰階遊戲結束
    └── hud/
        └── Hud.js          # DOM HUD 更新（分數/等級/行數/Next/Hold）
```

## 技術重點

- **無外部物理引擎** — 物理全為手寫 JS，直接更新 OGL `Transform`
- **無 GLTF / 模型載入** — 幾何全由 OGL primitives 與自訂 `Geometry`/`Program` 程序生成
- **SDF 圓角方塊** — Fragment Shader 以 `sdRoundBox` 距離場渲染圓角與邊緣光暈，無需額外頂點細分
- **InstancedMesh** — 已定位方塊使用單一 InstancedMesh + 自訂實例化 Shader，單次 Draw Call 渲染最多 2000 格
- **Bloom 後處理** — 利用 OGL `Post` 的 Ping-Pong FBO 鏈：亮度提取 → 6 輪高斯模糊 → 合成疊加
- **CPU 粒子物理** — 位置/速度在 CPU 更新後寫入 GPU Buffer，`gl.POINTS` + `gl.SRC_ALPHA, gl.ONE` 加法混合
- **自訂補間引擎** — 取代 GSAP，零依賴；支援 easeOutCubic / easeInOutQuad / easeOutBack
- **DAS / ARR** — 方向鍵延遲自動重複 170ms / 50ms，手感貼近競技俄羅斯方塊
- **Shaders** — GLSL 以 `/* glsl */` 模板字串內嵌於 JS 的 OGL `Program` 設定中

## 測試

純邏輯模組以 Node.js 內建測試框架覆蓋，不觸及 WebGL / DOM：

```sh
cd 3D-Tetris
node --test test/*.test.js
```

涵蓋：Grid（碰撞/鎖定/層消除/壓實）、Piece（移動/三軸旋轉/Wall Kick/幽靈）、Score（計分/等級/速度）。

## 相關文件

- [`plan.md`](./plan.md) — 完整遊戲設計規格（場景、方塊、控制、特效）
- 專案根目錄 [`AGENTS.md`](../AGENTS.md) — 倉庫規範（OGL only、miniserve、無實體引擎）

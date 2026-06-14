# 3D Pinball — OGL

基於 [OGL](https://github.com/oframe/ogl) 的 3D 彈珠台，20×40 傾斜台面上搭載手寫 2D 物理引擎（重力、摩擦、CCD 碰撞）、自訂 PBR 金屬球、Bloom 後處理霓虹風格與 Web Audio 合成音效。

> **嚴禁引入任何 Three.js 依賴** — 全部渲染以 OGL 完成，零外部套件。

## 特色

- **手寫物理引擎** — 2D 台面空間 (x∈[-10,10], y∈[0,40]) 運算後映射至 3D 傾斜台面；含重力、摩擦阻尼、速度上限 60、CCD 子步細分（速度 >30 時 4 子步）
- **碰撞系統** — 球 vs 線段（22 面牆）、球 vs 圓形（保險槓/彈射器）、球 vs 旋轉翻板（含角速度推力）、球 vs 三角碰塊（三邊最近距離）
- **翻板物理** — 靜止 -25° / 擊球 +55°，含角速度計算與擊球推力（`angularVel × armLen × 0.6`）
- **自訂 PBR 金屬球** — Fragment Shader 實作 Schlick Fresnel + GGX 簡化高光 + Cubemap 環境反射（metalness 0.95, roughness 0.15），加 Fresnel 邊緣光與最低亮度確保可見性
- **程序生成 Cubemap** — 6 面 Canvas 2D 繪製霓虹漸層 + 光點，作為金屬球反射環境
- **Bloom 後處理** — OGL `Post` Ping-Pong FBO 鏈（亮度閾值 0.5 → 高斯模糊 → 強度 0.6 疊加）
- **8 種 Web Audio 音效** — 純 OscillatorNode + Noise 合成，涵蓋保險槓、彈射器、翻板、彈簧、落球、連擊、獎勵、遊戲結束
- **粒子系統** — CPU 更新 `gl.POINTS` 粒子池，碰撞時爆射 8-12 顆
- **Camera Shake** — 碰撞 0.15 震幅 / 落球 0.3，隨機偏移 `Camera.position`
- **燈帶動態變色** — 預設綠呼吸 → Combo 黃閃爍 → 遊戲結束紅脈衝

## 執行方式

純 ES Modules，需透過 HTTP 伺服器載入 (`file://` 會被 CORS 擋下)。依 AGENTS.md 規範使用 `miniserve`：

```sh
cd 3D-Pinball
miniserve . --index index.html
```

開啟瀏覽器連到 `http://localhost:8080/`（或 miniserve 指定的埠）。

## 操作

| 按鍵 | 動作 |
| --- | --- |
| `Space`（按住） | 彈簧蓄力（0-2s，速度 20-60） |
| `Space`（放開） | 發射彈球 |
| `Z` | 左翻板（按住抬起，放開落下） |
| `M` | 右翻板（按住抬起，放開落下） |

## 台面配置

```
         ┌─────────────────────┐
         │    頂端圓弧 (16 段)    │  ← y=40  (彈簧發射區)
         │  ○保險槓    ○保險槓   │
         │       ○保險槓        │  ← y=28-33
         │  △三角碰塊  △三角碰塊  │
         │       △三角碰塊       │  ← y=18-23
         │ ○彈射器    ○彈射器   │  ← y=11
         │  ╲  inlane  ╱       │
         │    ╲       ╱        │
         │  ◇翻板 ◇翻板         │  ← y=5.5 (底部)
         └─────╲ DRAIN ╱───────┘  ← y=0   (落球口)
```

## 計分與機制

| 元素 | 分數 |
| --- | --- |
| 圓形保險槓 | 100 |
| 彈射保險槓 (Slingshot) | 50 |
| 三角碰塊 | 30 |
| 獎勵通道完整通過 | +500 |
| 全保險槓擊中 (一球內) | +1000 |
| 保險槓 2s 內三連擊 | +500 (COMBO) |

- **初始 3 顆球**，前 15 秒 Ball Save 落球不扣命
- **倍率**：每 5000 分 +0.1x（1.0x → 3.0x），落球後重置
- 落球後倍率、Combo 歸零

## 專案結構

```
3D-Pinball/
├── index.html              # Canvas (#gl) + DOM HUD 疊加層 + Module 入口
├── plan.md                 # 詳細設計規格（台面/物理/計分/特效）
└── src/
    ├── main.js             # 整合入口：遊戲狀態機、渲染迴圈、碰撞分發
    ├── constants.js        # 所有常數（物理、台面、保險槓、翻板、彈簧、燈光）
    ├── physics.js          # 2D 物理：重力/摩擦/CCD/碰撞（牆/圓/翻板/三角）/落球
    ├── input.js            # 鍵盤輸入（Z/M 翻板、Space 彈簧蓄力）
    ├── score.js            # 計分、倍率、Combo、Ball Save、球數管理
    ├── audio.js            # Web Audio 合成音效（Oscillator + Noise）
    ├── table.js            # 台面建模：底板/邊牆/玻璃/燈帶 + SharedUniforms
    ├── elements.js         # 台面元素：翻板/保險槓/彈射器/三角碰塊/彈簧/獎勵通道
    ├── ball.js             # 金屬球：程序 Cubemap 生成 + 位置同步
    ├── shaders.js          # 所有 GLSL（PBR 球/Lit/霓虹/玻璃/粒子/Bloom）
    ├── effects.js          # Bloom 後處理管線 (OGL Post)
    ├── particles.js        # CPU 粒子池 (gl.POINTS, Additive Blend)
    └── ui.js               # DOM HUD 更新（分數/球數/倍率/Ball Save/訊息）
```

## 技術重點

- **無外部物理引擎** — 物理全為手寫 JS，2D 台面空間運算後映射至 OGL `Transform` 節點
- **無 GLTF / 模型載入** — 幾何全由 OGL primitives（`Cylinder`/`Sphere`/`Box`）與自訂 `Geometry`/`Program` 程序生成
- **PBR 金屬球** — 自訂 Fragment Shader 實作 Schlick Fresnel 近似 + 簡化 GGX 高光 + Cubemap `textureCube` 環境反射採樣
- **程序 Cubemap** — 6 面 Canvas 2D 繪製霓虹光點漸層後注入 OGL `Texture`（`TEXTURE_CUBE_MAP`），無需外部 HDR 檔案
- **Bloom 後處理** — OGL `Post` 多 pass FBO 鏈：場景渲染 → 亮度提取 → 高斯模糊 → 合成疊加
- **CCD 碰撞防穿** — 球速 > 30 時每幀細分 4 子步，避免高速穿牆
- **旋轉翻板碰撞** — 線段碰撞 + 接觸點角速度 → 切線速度，擊球時加入推力（`flipperVx × 0.5 + normal × pushForce × 0.3`）
- **Inlane 導引牆** — 斜牆由外牆高處向翻板支點低處傾斜，重力引導球進入翻板區
- **Shaders** — GLSL 以 `/* glsl */` 模板字串內嵌於 JS 的 OGL `Program` 設定中

## 相關文件

- [`plan.md`](./plan.md) — 完整遊戲設計規格（台面、物理常數、控制、音效）
- 專案根目錄 [`AGENTS.md`](../AGENTS.md) — 倉庫規範（OGL only、miniserve、無實體引擎）

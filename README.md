# OGL GameDev

基於 [OGL](https://github.com/oframe/ogl) 的 3D 遊戲開發專案。

> **嚴禁引入任何 Three.js 依賴，3D 渲染架構必須強制基於 OGL 進行底層實作。**

## 目錄結構

```
OGL/
├── ogl/                  ← OGL 函式庫原始碼 (v1.0.11)
├── 3D-Pinball/           ← 3D 彈珠台
│   └── plan.md
├── 3D-Tetris/            ← 3D 俄羅斯方塊
│   └── plan.md
├── Roller-Coaster/       ← 雲霄飛車
│   └── plan.md
├── Rubik's-Cube/         ← 魔術方塊
│   └── plan.md
└── original-threejs-plan/← 原始 Three.js 計畫（參考用，不實作）
```

## 遊戲專案

| 專案 | 說明 |
|---|---|
| **3D Pinball** | 深色街機霓虹風格彈珠台，含 Bloom 後處理、PBR 金屬球、自訂物理碰撞 |
| **3D Tetris** | 3D 俄羅斯方塊 |
| **Roller Coaster** | Catmull-Rom 軌道、Frenet-Serret 車輛定向、多視角相機、隧道管狀幾何 |
| **Rubik's Cube** | 3D 魔術方塊 |

## 技術棧

- **渲染**: [OGL](https://github.com/oframe/ogl) — 極簡 WebGL 函式庫（零依賴，29kb）
- **語言**: JavaScript / TypeScript
- **無外部物理引擎** — 純 JS 實作

## OGL 核心模組

| 層級 | 模組 |
|---|---|
| **Core** | `Renderer`, `Camera`, `Transform`, `Geometry`, `Program`, `Mesh`, `Texture`, `RenderTarget` |
| **Math** | `Vec2/3/4`, `Mat3/4`, `Quat`, `Color`, `Euler` |
| **Extras** | `Box`, `Sphere`, `Curve`, `Tube`, `Post`, `GLTFLoader`, `Orbit`, `Raycast`, `GPGPU`, `Flowmap`, `Shadow`, `InstancedMesh` 等 |q

# 黃昏樂園 Dusk Park — OGL GameDev Monorepo

基於 [OGL](https://github.com/oframe/ogl) 的 3D 主題樂園 meta-game 整合專案。

> **無任何 Three.js 或高階依賴，3D 渲染架構基於 OGL 進行底層實作。**

**🎮 線上 Demo：<https://g36maid.github.io/cg-final-project/Theme-Park/>**

## 概述

本專案是一個 3D 主題樂園 meta-game（黃昏樂園），玩家在黃昏時分的樂園廣場漫遊，透過遊玩三個 arcade 子遊戲（彈珠台、魔術方塊、俄羅斯方塊）賺取代幣（Tokens），再花費代幣搭乘雲霄飛車。Meta-game 場景承擔電腦圖學期末 spec 的所有硬性圖學門檻；四個子遊戲透過頁面切換整合，保留各自原有玩法。

## 目錄結構

```
├── Theme-Park/          ← 黃昏樂園 Meta-game（本 branch 主要開發標的）
│   ├── index.html          Meta-game 入口
│   ├── styles.css          全域樣式
│   ├── plan.md             權威 spec（必讀）
│   ├── DEVLOG.md           開發踩坑記錄
│   ├── ogl/                ← Symlink → ../ogl
│   └── src/
│       ├── main.js             DuskPark 主程式
│       ├── constants.js        所有可調常數
│       ├── hub/                 場景模組（skybox, lighting, player, facilities, fountain, shadow）
│       ├── shaders/             GLSL（Phong + Skybox）
│       ├── geometry/            地面幾何
│       └── meta/                狀態、HUD、導航、子遊戲 hook
├── 3D-Pinball/           ← 3D 彈珠台（子遊戲）
├── 3D-Tetris/            ← 3D 俄羅斯方塊（子遊戲，WIP）
├ Roller-Coaster/         ← 雲霄飛車（子遊戲）
├── Rubik's-Cube/         ← 魔術方塊（子遊戲）
├── ogl/                  ← OGL 函式庫原始碼 (v1.0.11, vendored)
├── report/               ← LaTeX 設計文件（Tectonic build）
├── spec/                 ← 課程 spec
└── original-threejs-plan/← 原始 Three.js 計畫（參考用，不實作）
```

## 執行

**必須從 repo 根目錄啟動**，讓所有子遊戲的相對路徑正確解析：

```sh
miniserve . -p 8765 --index index.html
```

瀏覽器開啟 `http://localhost:8765/Theme-Park/`。

> `--index index.html` 讓 miniserve 在收到目錄路徑時自動回傳 `index.html`（例如 `/Theme-Park/` → `Theme-Park/index.html`）。Repo 根目錄沒有 `index.html`，miniserve 會顯示警告並在 `/` 列出目錄，這是預期行為。**請勿加 `--no-symlinks`**——`Theme-Park/ogl/` 是 symlink。

## 子遊戲整合

子遊戲透過頁面切換（page navigation）整合，不是在 WebGL 裡嵌入：

- **Meta-game → 子遊戲**：`location.href = '../3D-Pinball/index.html?from=hub'`
- **子遊戲 → Meta-game**：`hooks.returnToHub()` → fade 過渡 → 回到樂園
- **Token 狀態**：所有交易經 `localStorage['dusk-park-state']`
- **返回按鈕**：`hooks.injectBackButton()` 在子遊戲右上角注入「↩ 返回樂園」

**不修改子遊戲核心邏輯**——只在 score/exit 點加 hook。

## Spec 技術對應

| Spec 項 | 實作位置 |
|---|---|
| T1 玩家滑鼠+鍵盤移動/旋轉 | Meta-game — WASD + pointer lock |
| T2 有意義的相機控制 | Meta-game — C 鍵切換第一/第三人稱 |
| T3 點光源 + Phong | Meta-game — 路燈點光源 + directional sun fill |
| T4 材質貼圖 | Meta-game — 石板地面 UV tile + 建物程序貼圖 |
| T5 Skybox | Meta-game — 黃昏程序 cubemap, 500³ |
| T6 Cube map 反射 | Meta-game 噴泉水面 Fresnel 反射 |
| T7 Shadow mapping | Meta-game — 2048² depth map + 建物陰影 |

## 遊戲專案

| 專案 | 說明 |
|---|---|
| **黃昏樂園 (Theme-Park)** | Meta-game：第一人稱漫遊、代幣經濟、子遊戲導航 |
| **3D Pinball** | 深色街機霓虹風格彈珠台，含 Bloom、PBR、自訂物理 |
| **3D Tetris** | 3D 俄羅斯方塊（WIP） |
| **Roller Coaster** | Catmull-Rom 軌道、Frenet-Serret 相機 |
| **Rubik's Cube** | 3D 魔術方塊 |

## 技術棧

- **渲染**: [OGL](https://github.com/oframe/ogl) v1.0.11（vendored, `ogl/` 目錄）
- **語言**: JavaScript（純 ES modules）
- **無外部物理引擎**、無 build step、無 npm 套件

## 測試

| 專案 | 指令 |
|---|---|
| Rubik's-Cube | `npm test`（從專案目錄執行） |
| 3D-Tetris | `node --test test/*.test.js`（從專案目錄執行） |

Theme-Park 無測試。測試只涵蓋純邏輯模組，不涉及 WebGL 或 DOM。q

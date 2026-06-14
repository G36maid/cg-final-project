# 黃昏樂園 Dusk Park — 期末專案設計規格

> 本檔為權威 spec。實作前必讀。任何設計變更先更新本檔。

## 1. 概述

一個以 OGL WebGL 函式庫實作的 3D 主題樂園 meta-game。玩家在黃昏時分的樂園廣場漫遊，透過遊玩三個 arcade 子遊戲（彈珠台、魔術方塊、俄羅斯方塊）賺取代幣（Tokens），再花費代幣搭乘雲霄飛車。

本專案**整合既有的四個獨立遊戲**，並以 hub 場景統一展示電腦圖學期末 spec 的所有硬性技術門檻。每項 spec 需求都在「最低成本的那一層」被滿足 — 場景級的技術（skybox、點光源、相機、玩家控制）集中做一次在 hub，子遊戲保留各自的強項。

## 2. 設計決策定案

| 項目 | 決策 | 理由 |
|---|---|---|
| 架構 | **Scene-swap Hub (B)** — Hub 為獨立 3D 場景，子遊戲透過頁面切換整合 | 避免 unify 4 套 OGL renderer 的工程地獄，仍保留園區感 |
| 子遊戲 | **全保留**（3D-Pinball / Rubik's-Cube / 3D-Tetris / Roller-Coaster） | 各有可貢獻的圖學/機制 |
| Meta 經濟 | **Tokens**：arcade 遊戲賺分 → 雲霄飛車消耗 | 製造遊玩節奏與回饋迴圈 |
| 失敗狀態 | **不設計**（純 sandbox） | 降低摩擦 |
| 飛車數量 | **1 條主軌道** + 教學用「繞園列車」（選配） | 主軌道花 token；列車免費導覽 |
| 視覺風格 | **黃昏樂園（Dusk Park）** | 見下節 |

## 3. 視覺風格：黃昏樂園（Dusk Park）

### 為什麼不是白天也不是夜晚

白天會讓 spec 的圖學硬門檻**效果打折**：點光源幾乎看不到、影子短平、Pinball/Tetris 的霓虹風格在戶外突兀。夜晚則讓雲霄飛車的地景看不見。**黃昏（golden hour → dusk）是圖學展示的最佳時段**：

| Spec 項 | 黃昏如何最佳化 |
|---|---|
| T3 點光源 + Phong | 低角度暖陽當 directional fill + 路燈/招牌當點光源，暗背景下 Phong 三項（ambient/diffuse/specular）全亮 |
| T5 Skybox | 日落漸層 + 遠景城市/山巒剪影，cube map 容易做 |
| T7 Shadow | 長投影超戲劇化，shadow mapping 效果一目了然 |
| T6 反射 | 中央廣場噴泉水面反射黃昏天空與霓虹 |
| 子遊戲契合 | Arcade 室內自然偏暗偏霓虹，三個 arcade 子遊戲零重作；Coaster 在黃昏下最有戲劇性 |

### 配色方向

- 天空：橙紅 → 粉紫 → 深藍漸層
- 主光：暖橘金（低角度夕陽）
- 點光源：暖黃路燈 + 霓虹招牌（粉/青/紫）
- 地面：中性灰石板（吸光、好反射）
- 強調色：青/洋紅霓虹（與 arcade 室內呼應）

### 設計文件論述

「樂園在日夜之交的黃昏運轉，玩家在此穿越現實與遊戲宇宙的邊界」— 黃昏本身是過渡狀態，呼應 meta-game 的「hub 作為通往各遊戲宇宙的入口」敘事。原創性高，避開 spec §3 的 re-skin 警告。

## 4. 設施結構

```
                    ┌─────────────────────┐
                    │   黃昏樂園 Hub       │
                    │   (戶外廣場)         │
                    │                     │
                    │   ┌─ 中央噴泉 ◐ ← T6│
                    │   │  (cubemap反射)   │
                    │   │                 │
                    │   ▼                 │
        ┌──────┐  ┌─────────┐  ┌──────────┐
        │ Tour │  │ Arcade  │  │ Coaster  │
        │ Train│  │  Hall   │  │ Station  │
        │ (免) │  │ (室內)  │  │ (花token)│
        └──────┘  └────┬────┘  └──────────┘
                         │
                ┌────────┼────────┐
                ▼        ▼        ▼
            Pinball   Rubik's   Tetris
            機台       機台       機台
```

### 設施角色

| 設施 | 角色 | 入口 | 內容 |
|---|---|---|---|
| **Arcade Hall** | 室內建物，放 3 台 arcade 機台 | 走進門觸發 → 進入大廳選機台 | 內部暗 + 霓虹，三個子遊戲零重作 |
| **Coaster Station** | 雲霄飛車月台 | token ≥ 20 → 扣款上車 | 進入 Roller-Coaster 場景 |
| **Tour Train Station** | 繞園列車（選配） | 免費 | 用 coaster 的 track 技術做慢速繞園軌道 |
| **中央噴泉** | 廣場中央裝飾 | 不可進入 | cubemap 反射展示點（T6） |
| **入口資訊板** | 廣場邊緣 | 不可進入 | D6 說明 + token 計數（D3） |

## 5. Meta 經濟

### 貨幣：Tokens

| 設施 | Token 流動 | 觸發點 |
|---|---|---|
| Pinball | 分數 → tokens（100 分 = 1 token） | 球漏 / game over 時結算上繳 |
| Rubik's Cube | 解開給 30 tokens + 步數 bonus | 偵測 solved 時 |
| 3D-Tetris | 消行換（1 行 = 3 tokens） | 每次消行立即累積，game over 結算 |
| Tour Train | 免費 | — |
| Coaster | 每趟花 20 tokens | 進站時扣款 |

### 目標與進度

- **無失敗狀態**（純 sandbox）
- 起始 0 token → 必須先玩 arcade 攢分（教學牽引）
- 搭乘 coaster = 主要「消費」動作
- **軟 Win state**：搭乘 coaster 第 3 次 → 煙火 + "You completed the tour" 畫面（非強制結束，可繼續玩）

### 狀態持久化

`localStorage` key: `dusk-park-state`

```json
{
  "tokens": 0,
  "coasterRides": 0,
  "gamesPlayed": { "pinball": 0, "rubiks": 0, "tetris": 0 },
  "achievements": []
}
```

## 6. Spec 技術對應表

期末 spec 硬性門檻 → 本專案在哪一層滿足：

### Technical Implementation (25%)

| Spec 項 | 滿足位置 | 實作方式 |
|---|---|---|
| T1 玩家滑鼠+鍵盤移動/旋轉 | **Hub** | 第一人稱 WASD + mouse look（pointer lock） |
| T2 有意義的相機控制 | **Hub** | 第一人稱 ↔ 第三人稱切換鍵（C 鍵） |
| T3 點光源 + Phong (ambient+diffuse+specular) | **Hub** | 路燈點光源，完整 Phong shader（含 specular 項） |
| T4 至少一物件材質貼圖 | **Hub** | 廣場石板地面 UV 貼圖 + 建物外牆貼圖 |
| T5 Skybox 環境 cube map | **Hub** | 黃昏 cube map（漸層 + 剪影） |
| T6 Cube map 反射/折射 | **Hub 噴泉水面 + Pinball 球** | 動態 planar reflection 或靜態 cubemap reflection |
| T7 三選二（shadow / dynamic reflection / bump mapping）| **Hub shadow + Pinball 動 reflection** | Shadow mapping from 點光源 + Pinball 球既有 cubemap 反射 |

### Game Mechanics (25%) — 6 維度

| 維度 | 滿足位置 | 實作方式 |
|---|---|---|
| D1 清晰目標 | **Meta** | 「賺 tokens → 搭飛車 → 搭 3 趟完成導覽」明確目標 |
| D2 碰撞/互動偵測 | **Hub**（走進建物觸發）+ 子遊戲自身 | 走入建物入口的 AABB 觸發區 |
| D3 計分/進度可見 | **Meta HUD** | 螢幕上方 token 計數 + 搭乘次數 |
| D4 輸贏狀態 | **Meta** | 軟 win：搭 3 次 → 煙火慶祝；無 lose |
| D5 遊戲回饋 | **Hub**（UI 動畫、音效）+ 子遊戲既有 | token 增減時 UI 跳動 + 音效；子遊戲各自有粒子/震動 |
| D6 遊戲內說明 | **Hub 入口資訊板** | 廣場邊緣可見的操作/目標/設施說明面板 |

預期 D1-D6 全部滿足 → Game Mechanics 滿分（100%/25%）。

## 7. 操作說明

### Hub 控制

| 輸入 | 動作 |
|---|---|
| W A S D | 移動 |
| 滑鼠 | 視角（pointer lock） |
| C | 切換第一/第三人稱 |
| E | 與設施互動（進入建物 / 搭車） |
| ESC | 解除 pointer lock（顯示游標） |
| M | 開啟地圖/說明面板 |

### 子遊戲控制

各子遊戲保留原控制，額外：
- 螢幕角落顯示「返回樂園」按鈕（ESC 顯示游標後可點）
- 結算時顯示獲得 tokens 並自動上繳

## 8. 檔案結構

```
Theme-Park/
├── index.html              # Hub 入口
├── plan.md                 # 本檔（權威 spec）
├── README.md
├── styles.css
└── src/
    ├── main.js             # Hub entry、game loop、場景初始化
    ├── constants.js        # 物理常數、顏色、座標、設施位置
    ├── hub/
    │   ├── scene.js        # OGL Scene/Renderer/Camera 初始化
    │   ├── skybox.js       # 黃昏 cube map 生成與 skybox mesh
    │   ├── lighting.js     # 點光源、 directional fill、ambient
    │   ├── player.js       # 第一人稱控制器 + pointer lock
    │   ├── camera-rig.js   # 第一/第三人稱切換
    │   ├── facilities.js   # 建物外觀 + AABB 觸發區
    │   ├── fountain.js     # 中央噴泉 + 反射
    │   └── info-board.js   # 入口說明面板
    ├── shaders/
    │   ├── phong.js        # 完整 Phong（含點光源 + shadow）
    │   ├── skybox.js       # Skybox shader
    │   ├── fountain.js     # 反射 shader
    │   └── common.js       # 共用 GLSL 片段
    ├── meta/
    │   ├── store.js        # localStorage token 狀態
    │   ├── hud.js          # 全域 HUD（token/rides/說明）
    │   └── nav.js          # 子遊戲導航 + fade 過渡
    └── geometry/
        ├── ground.js       # 廣場地面
        └── buildings.js    # 建物外牆
```

### OGL import 路徑

從 `Theme-Park/src/main.js`（深度 2）：`import { ... } from '../../ogl/src/index.js'`
從 `Theme-Park/src/hub/*.js`（深度 3）：`import { ... } from '../../../ogl/src/index.js'`

不引入任何 npm 套件。

## 9. 實作階段

### Phase 1 — Hub 基礎（最大戰場，所有硬門檻在這）

- [ ] 場景骨架：index.html + main.js + Renderer/Camera/Transform 初始化
- [ ] Skybox cube map（黃昏漸層 + 遠景剪影）— **T5**
- [ ] 玩家第一人稱控制器（WASD + mouse look）+ 第三人稱切換 — **T1, T2**
- [ ] 點光源路燈 + 完整 Phong shader — **T3**
- [ ] 地面/建物外牆貼圖 — **T4**
- [ ] Shadow mapping from 點光源 — **T7a**
- [ ] 中央噴泉 cubemap 反射 — **T6**
- [ ] Hub 幾何：廣場 + Arcade Hall + Coaster Station + Tour Train Station + 資訊板
- [ ] 驗證：miniserve 跑起來，視覺 QA，確認 T1-T7 全過

### Phase 2 — Meta 狀態層

- [ ] localStorage token store（`meta/store.js`）
- [ ] 全域 HUD：token 計數、搭乘次數、說明板（D1/D3/D6）
- [ ] 場景切換機制（fade 過渡 hub ↔ 子遊戲）（`meta/nav.js`）

### Phase 3 — 子遊戲整合 hook

- [ ] 共用 hook 模組（payout + returnToHub）放各子遊戲可 import 處
- [ ] Pinball：球漏/game over 時 payout + return hook
- [ ] Rubik's Cube：solved 時 payout + return hook
- [ ] 3D-Tetris：消行/遊戲結束時 payout + return hook

### Phase 4 — Coaster 整合

- [ ] Coaster Station 入口（hub 端）：檢查 token ≥ 20 → 扣款 → 載入 coaster
- [ ] Coaster 端：ride 完成時計 rides++ + return hook
- [ ] （選配）Tour Train：用 coaster track 技術做繞園慢速軌道

### Phase 5 — Polish

- [ ] 軟 win 煙火/慶祝動畫
- [ ] 音效（hub 環境音 + UI 回饋音）
- [ ] 整體視覺微調

## 10. 執行方式

從 repo 根目錄執行，讓 Hub 與所有子遊戲都在同一個 server root 下：

```sh
miniserve . -p 8765 --index index.html
```

瀏覽器開啟 `http://localhost:8765/Theme-Park/`。純 ES modules，瀏覽器直接載入，無 build step。

## 11. 與既有子遊戲的整合協議

- **導航**：Hub 透過 `location.href = '../3D-Pinball/index.html'` 切換到子遊戲；子遊戲讀 URL param `?from=hub` 顯示返回鈕
- **狀態**：所有 token 交易經 `localStorage['dusk-park-state']`
- **不改子遊戲核心邏輯**：只在 score/exit 點加 hook，不動物理/渲染

## 12. 風險與備案

| 風險 | 備案 |
|---|---|
| Hub 工程量大於預期 | 先做最小可玩 hub（廣場 + 1 棟建物 + skybox），再加設施 |
| Shadow mapping 效能問題 | 降低 shadow map 解析度或限制只對鄰近物件 |
| 子遊戲 hook 整合衝突 | 共用 hook 模組獨立放置，不修改子遊戲原始 score 邏輯 |
| Tour Train 時間不足 | Phase 4 選配，先跳過 |

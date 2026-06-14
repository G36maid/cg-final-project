# 黃昏樂園 Dusk Park

期末專案 — 以 OGL 實作的主題樂園 meta-game，整合既有的四個 3D 遊戲。

**🎮 線上 Demo：<https://g36maid.github.io/cg-final-project/Theme-Park/>**

## 這是什麼

一個 3D 主題樂園廣場（hub），玩家在黃昏時分漫遊，透過遊玩三個 arcade 子遊戲（彈珠台、魔術方塊、俄羅斯方塊）賺代幣（Tokens），再花代幣搭雲霄飛車。搭乘 3 次完成導覽，解鎖煙火慶祝。

Hub 場景承擔電腦圖學期末 spec 的所有硬性圖學門檻；四個子遊戲透過頁面切換整合，保留各自原有玩法。

## 操作

| 按鍵 | 動作 |
|---|---|
| W A S D | 移動 |
| 滑鼠 | 視角（pointer lock） |
| C | 切換第一/第三人稱 |
| E | 與設施互動（進入建物 / 搭車） |
| M | 開關說明面板 |
| ESC | 解除滑鼠鎖定 |

## 設施

| 設施 | 說明 | 入口 |
|---|---|---|
| Arcade Hall | 三台機台：彈珠台、魔術方塊、俄羅斯方塊 | 走入建物觸發 → 進入 Pinball |
| Coaster Station | 每趟 10 Tokens | E 鍵扣款後載入雲霄飛車 |
| Tour Train | 免費繞園導覽（選配） | — |
| 中央噴泉 | Cubemap 反射展示 | 不可進入 |
| 入口資訊板 | 目標/操作/設施說明 | M 鍵查看 |

## Token 經濟

| 來源 | Token 計算 |
|---|---|
| Pinball | 完成一場固定 10 Tokens（game over 時結算） |
| Rubik's Cube | 解開固定 10 Tokens |
| 3D-Tetris | 完成一場固定 10 Tokens（game over 時結算） |
| Coaster | 每趟花 10 Tokens |

所有 Token 交易經 `localStorage['dusk-park-state']` 持久化。從 hub 進入子遊戲時畫面右上角出現「↩ 返回樂園」按鈕，回去自動顯示獲得 Token 數。

## Spec 技術對應

### Technical Implementation (T1-T7)

| Spec 項 | 實作 |
|---|---|
| T1 玩家滑鼠+鍵盤移動/旋轉 | WASD + pointer lock 第一人稱 |
| T2 有意義的相機控制 | C 鍵切換第一/第三人稱 |
| T3 點光源 + Phong | 路燈點光源 + directional sun fill，完整 Phong（ambient/diffuse/specular） |
| T4 至少一物件材質貼圖 | 廣場石板地面 UV tile + 建物外牆程序貼圖 |
| T5 Skybox | 黃昏程序 cubemap，500³ box |
| T6 Cube map 反射 | 噴泉水面 Fresnel 反射 |
| T7 Shadow mapping | OGL Shadow extra，2048² depth map，建物投射陰影至地面 |

### Game Mechanics (D1-D6)

| 維度 | 實作 |
|---|---|
| D1 清晰目標 | 「賺 tokens → 搭飛車 → 搭 3 次完成導覽」 |
| D2 碰撞/互動偵測 | AABB 接近觸發 + E 鍵互動 |
| D3 計分/進度可見 | HUD 顯示 token 數 + coaster rides |
| D4 輸贏狀態 | 軟 win：搭 3 次 → 慶祝畫面；無 lose |
| D5 遊戲回饋 | 接近提示、Token 增減通知 |
| D6 遊戲內說明 | M 鍵說明面板 |

## 設計規格

權威 spec 在 [`plan.md`](./plan.md)。實作前必讀。

## 執行

### 線上 Demo（GitHub Pages）

直接在瀏覽器打開：<https://g36maid.github.io/cg-final-project/Theme-Park/>

### 本機執行

從 repo 根目錄執行，讓 `/Theme-Park/` 這類子目錄路徑自動載入各自的 `index.html`：

```sh
miniserve . -p 8765 --index index.html
```

瀏覽器開啟 `http://localhost:8765/Theme-Park/`。

> `--index index.html` 讓 miniserve 在收到目錄路徑時自動回傳該目錄下的 `index.html`。Repo 根目錄沒有 `index.html`，所以 miniserve 會在 `/` 顯示目錄列表併發出一條無害警告，這是預期行為。**請勿加 `--no-symlinks`**——`Theme-Park/ogl/` 是指向 `../ogl/` 的 symlink。

純 ES modules，無 build step。

## 檔案結構

```
Theme-Park/
├── index.html              # Hub 入口 + HUD + info panel + fade overlay
├── styles.css              # 全域樣式（HUD、crosshair、info panel、loader）
├── plan.md                 # 權威 spec
├── src/
│   ├── main.js             # Hub entry、game loop、場景初始化、接近觸發
│   ├── constants.js        # 物理常數、顏色、座標、設施位置、Token 經濟
│   ├── hub/
│   │   ├── skybox.js       # 黃昏 cubemap 生成 + skybox mesh
│   │   ├── lighting.js     # 點光源 uniform 工廠 + 預設貼圖
│   │   ├── player.js       # 第一人稱控制器 + pointer lock + E/M 鍵
│   │   ├── facilities.js   # 3 建物 + 資訊板，程序貼圖
│   │   ├── fountain.js     # 中央噴泉 + cubemap 反射水面
│   │   └── shadow.js       # Shadow mapping（orthographic sun camera）
│   ├── shaders/
│   │   ├── phong.js        # Phong shader（8 點光源 + shadow sampling）
│   │   └── skybox.js       # Skybox vertex/fragment shader
│   ├── geometry/
│   │   └── ground.js       # 石板地面（程序貼圖 + UV tile）
│   └── meta/
│       ├── store.js        # localStorage 狀態持久化
│       ├── hud.js          # HUD 更新 + 慶祝畫面
│       ├── nav.js          # 場景切換（fade 過渡 + URL）
│       └── hooks.js        # 子遊戲共用 hook（payout + back button）
```

## 與子遊戲的整合

| 子遊戲 | 整合方式 | Token 計算 | 事件 |
|---|---|---|---|
| 3D-Pinball | `import` from hooks.js | 固定 10 | `dusk-park-gameover` |
| Rubik's Cube | `import` from hooks.js | 固定 10 (solve) | `dusk-park-solved` |
| 3D-Tetris | `import` from hooks.js | 固定 10 | `dusk-park-gameover` |
| Roller-Coaster | `import` from hooks.js | coasterRides++ | click back button |

各子遊戲透過 `?from=hub` URL param 啟用整合模式：顯示返回按鈕、監聽 Token 事件。所有子遊戲的 inline 整合 script 改為 ES module，統一從 `Theme-Park/src/meta/hooks.js` import helpers（`injectBackButton`、`addTokens`、`recordGamePlayed`、`showPayoutToast`、`ECONOMY`），不再各自寫死公式與 localStorage 操作。

## 技術棧

- **渲染**：[OGL](https://github.com/oframe/ogl) v1.0.11（vendored 在 `../ogl/`，相對路徑 import）
- **語言**：JavaScript（純 ES modules）
- **無外部物理引擎**、無 build step、無 npm 套件

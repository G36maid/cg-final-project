# 黃昏樂園 Dusk Park

期末專案 — 以 OGL 實作的主題樂園 meta-game，整合既有的四個 3D 遊戲。

## 這是什麼

一個 3D 主題樂園廣場（hub），玩家在黃昏時分漫遊，透過遊玩三個 arcade 子遊戲（彈珠台、魔術方塊、俄羅斯方塊）賺代幣（Tokens），再花代幣搭雲霄飛車。

Hub 場景承擔電腦圖學期末 spec 的所有硬性圖學門檻（點光源 + Phong、skybox、shadow mapping、cubemap 反射、材質貼圖、玩家控制、相機切換）；四個子遊戲透過頁面切換整合，保留各自原有玩法。

## 設計規格

權威 spec 在 [`plan.md`](./plan.md)。實作前必讀。

## 執行

```sh
miniserve .
```

從 `Theme-Park/` 目錄下執行。純 ES modules，瀏覽器直接載入，無 build step。

## 與其他遊戲的關係

本專案整合 repo 中的四個獨立遊戲：

- [`../3D-Pinball/`](../3D-Pinball/) — Arcade Hall 內的彈珠台機台
- [`../Rubik's-Cube/`](../Rubik's-Cube/) — Arcade Hall 內的魔術方塊機台
- [`../3D-Tetris/`](../3D-Tetris/) — Arcade Hall 內的俄羅斯方塊機台
- [`../Roller-Coaster/`](../Roller-Coaster/) — Coaster Station 的雲霄飛車設施

各子遊戲可獨立執行；從 hub 進入時會加上「返回樂園」與代幣結算 hook。

## 技術棧

- **渲染**：[OGL](https://github.com/oframe/ogl) v1.0.11（vendored 在 `../ogl/`，相對路徑 import）
- **語言**：JavaScript（純 ES modules）
- **無外部物理引擎**、無 build step、無 npm 套件

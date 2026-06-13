# 3D Tetris

## 1. 遊戲場景

* 網格大小 $10 \text{ (寬)} \times 20 \text{ (高)} \times 10 \text{ (深)}$
* 每個單元 $1\times1\times1$ 立方體
* 邊界用細線框 LineSegments 渲染 (#1A2444)
* 底部地板 + $10\times10$ GridHelper 網格線
* 4 個垂直邊角發光條（視覺錨定作用）

**相機與視角：**

* 默認從斜上方 45° 俯視遊戲區域中心
* OrbitControls 旋轉（不允許翻到底部以下）
* 4 個快捷視角（正面/右側/背面/俯視）

## 2. 方塊系統

7 種經典方塊（深色背景下統一明度，避免飽和）：

* I 型 薄荷青 #4ECDC4 (4 格直線)
* O 型 琥珀金 #F7D762 ($2\times2$ 正方形)
* T 型 薰衣紫 #B07CD8
* S 型 翠綠 #66D9A0
* Z 型 珊瑚紅 #F27068
* J 型 矢車菊藍 #5B8DEF
* L 型 落日橙 #F5923E

**3D 擴展**：在 X-Z 平面上移動、繞 X/Y/Z 旋轉
微弱 emissive 自發光 (intensity 0.15) + 圓角

以下是圖片中文字的完整擷取（已為你整理成 Markdown 表格格式）：

## 3. 操作控制

| 按鍵 | 功能說明 |
| --- | --- |
| $\leftarrow$ $\rightarrow$ | X 軸移動（左右） |
| $\uparrow$ $\downarrow$ | Z 軸移動（前後） |
| Space | 硬降落（直接落到底部） |
| Q / E | 繞 Y 軸旋轉 90° |
| W / S | 繞 X 軸旋轉（前翻/後翻） |
| A / D | 繞 Z 軸旋轉 |
| Shift | 加速下落 |
| C | 暫存當前方塊 (HOLD) |
| P | 暫停/繼續  ·  R 重新開始 |

移動/旋轉 100ms tween · 碰撞抖動反饋
硬降落 20-30 個粒子從落點向四周濺射

## 4. 遊戲邏輯

* 初始下落間隔 1000ms · 每消 10 行 -50ms（最低 200ms）
* 方塊從頂部中央生成，重疊則遊戲結束
* 3D 消除：Y 平面被填滿 ($10\times10=100$) 則該層消除

計分（$\times$ 當前等級）：

* 1 層 100 / 2 層 300 / 3 層 500 / 4+ 層 800
* 硬降落：落下格數 $\times$ 2
* 軟降落 (Shift)：落下格數 $\times$ 1

每消 10 層等級 +1 · 等級影響速度和倍率

## 5. 特效與視覺

* 幽靈方塊 (Ghost Piece)：
正下方半透明投影 · opacity 0.15 + emissiveIntensity 0.3 呼吸脈衝
* 消除動畫：emissive 脈衝 3 次 $\rightarrow$ 從中心向四周爆炸散開（粒子化 AdditiveBlending）
* 硬降落：落點光暈擴散（半透明光環 0.3s）
* Bloom (必須)：UnrealBloomPass
strength 0.4 / radius 0.8 / threshold 0.6
* 遊戲結束：去飽和 1.5s + 半透明遮罩

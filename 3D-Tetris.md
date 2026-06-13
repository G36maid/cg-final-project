# 3D Tetris

**嚴禁引入任何 Three.js 依賴， 3D 渲染架構必須強制基於 [OGL](https://github.com/oframe/ogl) 進行底層實作。**

## 1. 遊戲場景

* 網格大小 10 (寬) x 20 (高) x 10 (深)
* 每個單元 1 x 1 x 1 立方體
* 邊界用細線框渲染（使用 OGL `Geometry` 配合 `mode: gl.LINES` 與 `Mesh`，顏色 #1A2444）
* 底部地板 + 10 x 10 網格線（OGL 無內建 GridHelper，需自行生成線段頂點資料構建 `Geometry`）
* 4 個垂直邊角發光條（視覺錨定作用）

**相機與視角：**

* 默認從斜上方 45° 俯視遊戲區域中心，操作 OGL `Camera` 的 `position` 與 `lookAt`
* 相機軌道旋轉（不允許翻到底部以下，需自行攔截 DOM 指標事件並推導為相機 `Transform` 的球座標轉換，或引入開源相機控制邏輯）
* 4 個快捷視角（正面/右側/背面/俯視）

## 2. 方塊系統

7 種經典方塊（深色背景下統一明度，避免飽和）：

* I 型 薄荷青 #4ECDC4 (4 格直線)
* O 型 琥珀金 #F7D762 (2 x 2 正方形)
* T 型 薰衣紫 #B07CD8
* S 型 翠綠 #66D9A0
* Z 型 珊瑚紅 #F27068
* J 型 矢車菊藍 #5B8DEF
* L 型 落日橙 #F5923E

**3D 擴展**：更新 OGL 實例節點 `Transform`，在 X-Z 平面上移動 `position`、繞 X/Y/Z 更新 `quaternion`。
微弱 emissive 自發光 (intensity 0.15) + 圓角（OGL 極簡，無內建材質與圓角盒模型，需自訂 Fragment Shader 處理發光色疊加，並藉由頂點生成邏輯或 SDF Shader 處理圓角）。

## 3. 操作控制

| 按鍵 | 功能說明 |
| --- | --- |
| ← → | X 軸移動（左右） |
| ↑ ↓ | Z 軸移動（前後） |
| Space | 硬降落（直接落到底部） |
| Q / E | 繞 Y 軸旋轉 90° |
| W / S | 繞 X 軸旋轉（前翻/後翻） |
| A / D | 繞 Z 軸旋轉 |
| Shift | 加速下落 |
| C | 暫存當前方塊 (HOLD) |
| P | 暫停/繼續  ·  R 重新開始 |

移動/旋轉 100ms tween（需配合外部補間庫如 GSAP 驅動 OGL 屬性）· 碰撞抖動反饋
硬降落 20-30 個粒子從落點向四周濺射（透過 `mode: gl.POINTS` 的 `Geometry` 與自訂 `Program` 實作粒子更新）

## 4. 遊戲邏輯

* 初始下落間隔 1000ms · 每消 10 行 -50ms（最低 200ms）
* 方塊從頂部中央生成，重疊則遊戲結束
* 3D 消除：Y 平面被填滿 (10 x 10 = 100) 則該層消除

計分（x 當前等級）：

* 1 層 100 / 2 層 300 / 3 層 500 / 4+ 層 800
* 硬降落：落下格數 x 2
* 軟降落 (Shift)：落下格數 x 1

每消 10 層等級 +1 · 等級影響速度和倍率

## 5. 特效與視覺

* 幽靈方塊 (Ghost Piece)：
正下方半透明投影 · 透過 OGL `Program` 傳入 Uniforms 控制 opacity 0.15 + emissiveIntensity 0.3 呼吸脈衝（需開啟 `transparent: true`）
* 消除動畫：emissive 脈衝 3 次 → 從中心向四周爆炸散開（粒子化，需透過 `Program` 開啟 `transparent: true` 並呼叫 `setBlendFunc(gl.SRC_ALPHA, gl.ONE)` 實作 AdditiveBlending）
* 硬降落：落點光暈擴散（半透明光環 0.3s）
* Bloom (必須)：OGL 無內建 UnrealBloomPass，必須利用 `RenderTarget` 手動實作 Ping-Pong FBO Multi-pass 渲染（Pass 1: 提取亮度閾值 0.6，Pass 2 & 3: Ping-Pong 高斯模糊半徑 0.8，Pass 4: 將模糊結果以 strength 0.4 加成疊加回主場景）
* 遊戲結束：去飽和 1.5s + 半透明遮罩（藉由全螢幕 Post-processing Shader FBO 將畫面灰階化）

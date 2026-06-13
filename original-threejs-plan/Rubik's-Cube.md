# Rubik's Cube

## 1. 魔方建模

* $3\times3\times3$ 共 26 個可見小方塊（中心不渲染）
* 每個小方塊尺寸 $1.0 \times 1.0 \times 1.0$
* 間隙 0.08（總尺寸 $\sim3.24\times3.24\times3.24$）
* 每個小方塊是獨立的 Three.js Group：
· 1 個基體 Mesh（黑色圓角立方體）
· 1-3 個貼紙 Mesh（彩色圓角矩形）

維護純數據的魔方狀態對象，記錄每個小方塊當前在哪個位置、每面貼紙當前是什麼顏色。
旋轉操作先更新狀態數據，再驅動 3D 渲染。

## ## 2. 鼠標拖拽旋轉

這是整個項目最難的部分，必須精確實現。

四步交互：

1. **點擊拾取**：Raycaster 與貼紙面求交，記下 hitFace / hitCubie / hitPoint
2. **拖拽方向判定**：屏幕向量投影到 hitFace 平面，12 種（面 $\times$ 方向） $\rightarrow$ 旋轉軸 $+$ 旋轉層
3. **拖拽跟手**：屏幕 150 px $\approx$ 旋轉 90°
4. **鬆手吸附**：吸附到最近 90° 倍數，200ms easeOutBack（輕微過衝再回彈）

需與 OrbitControls 共存（命中魔方禁用 Orbit）

## ## 3. 打亂 (Scramble)

* 按 S 鍵或點 SCRAMBLE 按鈕
* 生成 20 步隨機旋轉序列
* 約束：連續兩步不能同面，連續三步不能同軸的兩面
* 每步動畫 120ms（比手動旋轉更快，緊湊感）
* UI 顯示打亂公式（標準魔方記號 R U' F2 D L' B ...）
* 打亂過程禁用鼠標交互和鍵盤旋轉

## 4. 自動求解

逐層求解法 (Layer by Layer · Beginner's Method):

階段 1 · 底面十字 (White Cross)
階段 2 · 底面角塊 (First Layer Corners)
階段 3 · 中間層棱塊 (Second Layer Edges)
階段 4 · 頂面十字 (OLL Edge Orientation)
階段 5 · 頂面顏色 (OLL Corner Orientation)
階段 6 · 頂層角塊歸位 (PLL Corners)
階段 7 · 頂層棱塊歸位 (PLL Edges)

不要求最優解（步數不限）· 200 步以內

這張圖片底部有一部分被遮擋了，以下是為你擷取的完整可見文字，並補全了最後一行被遮擋的推測字詞：

## 5. UI 界面

* 計時器 M:SS.ms · 首次旋轉自動開始
* MOVES 步數計數 + 撤銷/重做按鈕
* 2D 魔方展開圖（十字形 6 面 $3\times3$ 色塊）實時反映當前六面顏色
* 求解公式條：當前步高亮 #4ECDC4
已執行 #6A7A8A · 未執行 #E8ECF4
* 復原慶祝：26 塊向外展開 1s

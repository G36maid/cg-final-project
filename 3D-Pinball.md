# 3D Pinball

**嚴禁引入任何 Three.js 依賴， 3D 渲染架構必須強制基於 OGL 進行底層實作。**

## 1. 彈球機台建模

* 台面 20 (寬) x 40 (長) · 傾角 6°（頂端高於底端 4 單位 · 模擬真實斜面）
* 底板使用 OGL `Box` 幾何體 · 顏色 #0D0D12
* 邊牆高 2 單位 · 厚 0.5 · 頂端圓弧封閉
* 玻璃蓋板 (opacity 0.06, roughness 0.1，需透過自訂 OGL `Program` 實作半透明渲染與基礎光照模型，並確保開啟 `transparent: true`)

整體「深色街機霓虹」風格：金屬機殼 + 黑色台面 + 霓虹發光的碰撞器和燈帶 + Bloom 後處理

## 2. 台面元素

* 翻板 x 2：底部兩側 · 靜止 -25° / 擊球 +55°
透過 DOM 監聽鍵盤 Z (左) / M (右) 按住抬起，鬆開落下，並更新對應 OGL `Transform` 節點的 `rotation`
* 圓形保險槓 x 3：上半區三角分布 · #FF2266
彈射係數 1.2 · +100 分 · scale pulse (需外部補間邏輯驅動 `Transform.scale`) + 8–12 粒子 (使用 `mode: gl.POINTS` 的 `Geometry` 繪製)
* 彈射保險槓 x 2：翻板上方兩側 · 彈射 1.3 · +50 分
* 三角碰塊組：3 個倒三角 · 反彈 0.9 · +30 分
* 獎勵通道：弧形彎道 · 完整通過 +500 + BONUS 彈字 (可透過 HTML/CSS 疊加 2D UI)
* 彈簧發射：Space 蓄力 0-2s · 速度 20–60
* 落球口：球落 -1 命 · 前 15s Ball Save 不扣

## 3. 物理系統

不使用外部物理引擎，純 JS 實現（計算後更新 OGL 小球 `Transform` 的 `position`）：

* 每幀 position += velocity * dt
* 重力沿台面傾角：g * sin(6°) * dt
* 阻尼（摩擦）：velocity *= 0.999
* 速度上限 60 單位/秒（防隧穿）

**碰撞檢測：**

* 球 vs 圓柱：圓心距 < 球半徑 + 圓柱半徑
* 球 vs 線段/牆：點到線段最近距離 < 球半徑
* 球 vs 翻板：含角速度的旋轉線段
* 速度 > 30 啟用 CCD（每幀細分 4 子步）

## 4. 得分與機制

* 初始 3 顆球（HUD 小球圖標，使用 DOM UI 實作）
* Ball Save 前 15s 落球不扣命

**計分匯總：**

* Bumper 100 · 2s 內 3 連擊 +500 (COMBO)
* Slingshot 50 · 三角碰塊 30
* 獎勵通道完整通過 +500
* ALL BUMPERS（一球內全擊中）+1000

**倍率**：每 5000 分 +0.1x (1.0x -> 3.0x) · 落球後倍率重置 · 倍率顯示 #FFAA00

## 5. 視覺與音效

* Bloom (必須) · OGL 無內建 UnrealBloomPass，需使用 `RenderTarget` 建立 Ping-Pong FBO 實作多通道 (Multi-pass) 渲染
提取亮度 threshold 0.5 / 高斯模糊 radius 1.0 / 疊加 strength 0.6
* 球：需撰寫自訂 PBR Shader 實作金屬度 metalness 0.95，並載入 OGL `Texture` (Cubemap) 進行 envMap 實時反射採樣
* Camera shake：碰撞 0.15 / 落球 0.3（藉由隨機偏移 OGL `Camera` 的 `position` 實作）
* 燈帶：默認綠呼吸 · 得分追逐閃爍（透過 Uniform 動態傳遞時間與顏色狀態至 Shader）
· Combo 黃色 · 結束紅色脈衝

* 八種 Web Audio 合成音效

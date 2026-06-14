# Roller Coaster — OGL

基於 [OGL](https://github.com/oframe/ogl) 的 3D 雲霄飛車模擬，以 Catmull-Rom 样條構建閉合環狀軌道，搭配 Frenet-Serret (TNB) 標架定向車輛、能量守恆物理、五視角相機系統與含點光源的穿山隧道。

> **嚴禁引入任何 Three.js 依賴** — 全部渲染以 OGL 完成，零外部套件。

## 特色

- **閉合軌道** — Catmull-Rom 样條，512 段細分，涵蓋爬升、俯衝、360 垂直翻轉、螺旋、隧道、駝峰、S 彎與減速段
- **TNB 車輛定向** — 四節車廂以四元數 (`Quat`) 沿軌道切線/法線/副法線定向，無萬向鎖
- **能量守恆物理** — `v = √(v₀² + 2g(h₀ - h))`，含鏈條爬升段定速、曲率 G 力計算
- **五視角相機** — 第一人稱 / 第三人稱彈性跟隨 / 側面追蹤 / 自由軌道 / 電影機位，切換時 0.5 秒平滑過渡
- **隧道場景** — 拱形管狀幾何、Perlin 變形山體、 每 5 單位一盞橙色點光源 (Uniform Array 多光源)、FBO 積水反射、`POINTS` 灰塵粒子、進出洞 0.5 秒環境光過渡
- **2D Canvas HUD** — 即時顯示速度 (km/h)、高度 (m)、G 力、軌道完成百分比與當前視角

## 執行方式

純 ES Modules，需透過 HTTP 伺服器載入 (`file://` 會被 CORS 擋下)。依 AGENTS.md 規範使用 `miniserve`：

```sh
cd Roller-Coaster
miniserve . --index index.html --pretty-urls
```

開啟瀏覽器連到 `http://localhost:8080/`（或 miniserve 指定的埠）。

## 操作

| 按鍵 | 動作 |
| --- | --- |
| `1` | 第一人稱視角 |
| `2` | 第三人稱彈性跟隨 (預設) |
| `3` | 側面追蹤 |
| `4` | 自由軌道 (滑鼠拖曳旋轉 / 滾輪縮放) |
| `5` | 電影機位循環切換 |

## 專案結構

```
Roller-Coaster/
├── index.html              # WebGL (#gl) + HUD (#hud) 雙圖層
├── main.js                 # 整合入口：渲染迴圈、子系統更新
├── plan.md                 # 詳細設計規格（軌道/物理/相機/隧道）
├── ogl -> ../ogl           # 指向 vendored OGL 函式庫的符號連結
└── src/
    ├── config.js           # 所有常數（物理、軌道、車輛、顏色、燈光）
    ├── math/
    │   ├── frames.js       # tnbToQuat / 標架重正規化 / Banking 角
    │   └── perlin.js       # CPU 端 Perlin 雜訊
    ├── track/
    │   ├── controlPoints.js # 40+ 軌道控制點
    │   ├── TrackPath.js     # Catmull-Rom 求值 + Frenet 框架 + 弧長
    │   ├── TrackGeometry.js # 軌道幾何 (雙軌 + 枕木)
    │   └── TrackSampler.js  # 以弧長取樣，供物理/車輛/相機使用
    ├── physics/
    │   ├── Physics.js       # 能量守恆速度 + 區段偵測
    │   └── TrackSampler.js  # (同上)
    ├── vehicle/
    │   ├── carGeometry.js   # 車體/車鼻/座椅/輪子組裝
    │   └── Car.js           # 四節車廂沿軌道更新 Transform
    ├── camera/
    │   └── CameraRig.js     # 五模式 FSM + smoothstep/slerp 過渡
    ├── tunnel/
    │   ├── TunnelGeometry.js # 拱形管狀截面
    │   ├── Mountain.js       # 球體 + Perlin 位移 + 點光源填入
    │   ├── DustParticles.js  # 80 顆灰塵 POINTS
    │   ├── WaterReflection.js# RenderTarget FBO 反射
    │   └── ambientTransition.js # 進出洞環境光 0.5s 淡變
    ├── materials/
    │   ├── perlin.glsl.js    # GLSL 端 Perlin 雜訊
    │   ├── lighting.glsl.js  # 多點光源 GLSL 片段
    │   ├── metalProgram.js   # 金屬軌道/車體 Program
    │   └── rockProgram.js    # 岩石 Program + Uniform Array 點光源
    ├── hud/HUD.js            # 2D Canvas 疊加層
    └── input/Input.js        # 鍵盤/滑鼠事件
```

## 技術重點

- **無外部物理引擎** — 物理全為手寫 JS，直接更新 OGL `Transform`
- **無 GLTF / 模型載入** — 幾何全由 OGL primitives 與自訂 `Geometry`/`Program` 程序生成
- **多點光源** — OGL 無內建光源組件，於 Fragment Shader 以 `uniform vec3 uPointLightPos[32]` Uniform Array 實作
- **相機過渡** — `Vec3.lerp` + `Quat.slerp` 搭配 smoothstep 完成視角切換的 0.5 秒平滑插值
- **OGL 相機慣例** — 相機注視本地 `-Z`；`_lookAtQuat` 構建本地 `+Z → backward` 的基，讓 `-Z` 指向目標
- **Shaders** — GLSL 以 `/* glsl */` 模板字串內嵌於 JS 的 OGL `Program` 設定中

## 相關文件

- [`plan.md`](./plan.md) — 完整遊戲設計規格（軌道段落、物理常數、控制）
- 專案根目錄 [`AGENTS.md`](../AGENTS.md) — 倉庫規範（OGL only、miniserve、無實體引擎）

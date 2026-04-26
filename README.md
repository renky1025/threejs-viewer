# 3D 工业级模型查看器 (React + Three.js)

基于 Three.js 和 React 重构的工业级 3D 模型查看器。拥有媲美专业 CAD 软件（如 AutoCAD、SolidWorks）的视口交互体验、高保真 PBR 物理材质渲染，以及布料物理模拟功能。

## 🌟 核心特性

### 1. 工业级 CAD 视口交互
- **专业环境**：暗色系（Dark Theme）专业工作区背景，配合深色无限延伸地平面网格，有效降低视觉疲劳。
- **ViewCube 视角控制器**：位于屏幕右上角的交互式立方体，通过拖拽或点击面块，可实现无缝的正交/透视视角快速切换。
- **动态三轴指示器 (AxesHelper)**：位于屏幕右下角，全局实时同步当前摄影机的空间姿态，提供极佳的空间坐标系参考。
- **平移、旋转、缩放**：带有自动阻尼（Damping）和平滑过渡的视口轨道控制器。

### 2. 真实材质渲染实验室 (Material Sphere)
- **高保真光影**：借助 `PMREMGenerator` 和 `RoomEnvironment` 生成真实的物理级环境光遮蔽与反射。
- **PBR 材质预设**：一键切换 标准金属、磨砂金属、镜面抛光、陶瓷质感、青铜、红宝石透射材质等。
- **实时属性调节**：提供动态滑块调整金属度 (Metalness)、粗糙度 (Roughness)、透光率 (Transmission)、折射率 (IOR) 和厚度等参数。

### 3. 高级物理模拟：动态布料掉落 (Cloth Physics)
- **柔性体模拟**：基于 Verlet 积分和弹簧质点模型（Mass-Spring System）从零构建的高性能布料物理引擎。
- **随风舞动效果**：动态生成的正弦风力场，让布料在空中飘落时产生极为逼真的边缘褶皱与摇曳效果。
- **完美贴合包裹**：高度优化的碰撞检测与摩擦力算法，使布料准确落在材质球表面并“死死粘住”包裹球体，随球体轨道视角一起展现极佳的附着感。
- **多种布匹材质**：内置“丝绸 (Silk)”、“棉布 (Cotton)”、“牛仔布 (Denim)”物理和材质预设。

### 4. 丰富的高级模型分析工具
- **支持多格式加载**: OBJ, FBX, GLTF, GLB, STL，以及基于 WebAssembly (occt-import-js) 的工业 CAD 格式 **STEP, IGES**。
- **爆炸视图 (Exploded View)**: 一键将装配体模型的各个部件呈放射状分离开来，便于查看内部零件结构。
- **剖切分析 (Clipping)**: 支持多轴面剖切，精准查看模型内部截面结构。
- **空间测量 (Measurement)**: 高精度拾取模型顶点，测量任意两点之间的真实距离。
- **场景大纲 (Scene Graph)**: 树状管理模型层级结构，一键控制部件的显示/隐藏、透明度和锁定状态。
- **压力热力图 (Pressure Visualization)**: 加载 JSON 应力测试数据，以动态热力图映射显示在模型表面。

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite + ESModules
- **3D 渲染**: Three.js
- **UI/样式**: 纯 CSS (CSS Modules) + 玻璃拟物化设计 (Glassmorphism)
- **图标库**: lucide-react
- **状态管理**: Zustand
- **性能优化**: three-mesh-bvh (加速射线检测与碰撞计算)

## 📁 项目架构

```text
threejs-viewer/
├── public/                    # 静态资源、模型文件与纹理
├── src/
│   ├── components/            # React 业务组件
│   │   ├── ModelViewer/       # 3D模型主视口组件与面板 (测量, 剖切, 爆炸等)
│   │   ├── PressureViewer/    # 压力可视化展示组件
│   │   ├── ModelList.tsx      # 首页模型列表
│   │   └── AppToast.tsx       # 全局消息提示框
│   ├── core/                  # 独立于 UI 框架的 3D 核心引擎层
│   │   ├── cache/             # 远程模型缓存系统
│   │   ├── constraints/       # 场景级空间约束与贴地算法
│   │   ├── controllers/       # 控制器 (ViewCube, 测量, 剖切, 爆炸等)
│   │   ├── environment/       # 环境光、天空盒、地平面与网格生成
│   │   ├── helpers/           # 辅助器 (如右下角 AxesHelper)
│   │   ├── loaders/           # 统一模型加载与解析器
│   │   ├── scene/             # 场景结构管理与树状构建
│   │   └── types/             # 核心类型定义
│   ├── pages/                 # 路由页面
│   │   ├── Home.tsx           # 主页 (列表与上传入口)
│   │   ├── ModelPage.tsx      # 模型查看器与压力热力图分流页
│   │   └── MaterialSphere.tsx # 真实材质与物理布料实验室
│   ├── utils/                 # 工具函数
│   │   ├── clothPhysics.ts    # 布料弹簧质点物理模拟引擎
│   │   ├── threeLoader.ts     # 核心层与 React 视图层的桥梁装配器
│   │   └── modelSource.ts     # 模型来源类型解析
│   ├── App.tsx                # 根组件
│   └── main.tsx               # 应用入口
```

## 🚀 开发指南

### 环境配置与依赖安装

```bash
# 推荐使用 pnpm
pnpm install
```

### 本地开发运行

```bash
pnpm dev
# 浏览器将自动打开 http://localhost:5173
```

### 构建生产部署版本

```bash
pnpm build
pnpm preview
```

## ⚠️ 浏览器兼容性要求

本系统深度使用了 **WebGL 2.0** 与 **WebAssembly** 级高级特性（尤其是在加载 STEP/IGES 和执行复杂的网格 BVH 运算时）。
请确保使用以下现代浏览器：
- Google Chrome 90+
- Mozilla Firefox 88+
- Apple Safari 14+
- Microsoft Edge 90+

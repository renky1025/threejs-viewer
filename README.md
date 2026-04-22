# 3D 模型查看器

基于 Three.js 和 Vue 3 的 3D 模型查看器，支持多种 3D 模型格式的加载、查看和交互。
![列表](/images/listimage.png "列表")
![3d viewer](/images/image.png "3d viewer")

## 技术栈

- **前端框架**: Vue 3 + TypeScript + Vue Router
- **UI 组件库**: Element Plus
- **3D 渲染**: Three.js + three-mesh-bvh (高性能BVH加速)
- **构建工具**: Vite
- **状态管理**: Pinia
- **CAD支持**: occt-import-js (STEP/IGES格式)

## 功能特点

### 模型浏览
- 模型列表展示，支持筛选、分类和搜索
- 支持用户上传本地 3D 文件并直接网页预览
- 支持多种模型格式: OBJ, FBX, GLTF, GLB, STL, STEP, IGES

### 模型查看功能
- 平移、旋转、缩放控制
- 立方体控制器联动
- 模型加载进度显示
- 多种地面材质选择
- 逼真的天空效果
- 灯光和阴影效果

### 高级功能
- **爆炸视图**: 将模型的各个部件分离开来查看内部结构
- **剖切功能**: 支持多平面剖切，查看模型内部截面
- **测量工具**: 测量模型中两点之间的距离
- **场景图面板**: 查看和管理模型层级结构
- **材质编辑**: 实时调整模型材质参数
- **压力可视化**: 加载 JSON 压力数据，以热力图形式显示在模型表面

### 页面
- **首页** (`/`): 模型列表展示
- **模型查看页** (`/model/:name`): 3D模型交互查看
- **材质球展示** (`/material-sphere`): 材质效果预览

## 项目结构

```
threejs-viewer/
├── public/                    # 静态资源
│   ├── assets/               # 图片、纹理等资源
│   ├── home/                 # 模型分类数据
│   ├── models/               # 3D 模型文件
│   └── couch.mtl             # MTL材质文件
├── src/
│   ├── components/           # 组件
│   │   ├── ModelViewer/      # 3D模型查看器组件
│   │   │   ├── index.vue
│   │   │   ├── ClippingPanel.vue    # 剖切面板
│   │   │   ├── ExplodedPanel.vue    # 爆炸视图面板
│   │   │   ├── MeasurementPanel.vue # 测量工具面板
│   │   │   ├── SceneGraphPanel.vue  # 场景图面板
│   │   │   └── ViewerToolbar.vue    # 工具栏
│   │   ├── PressureViewer/   # 压力可视化组件
│   │   ├── CubeControl.vue   # 立方体控制器
│   │   ├── LoadingBar.vue    # 加载进度条
│   │   ├── ModelList.vue     # 模型列表
│   │   └── AppToast.vue      # 全局提示
│   ├── core/                 # 核心3D引擎模块
│   │   ├── cache/            # 缓存系统
│   │   ├── constraints/      # 场景约束
│   │   ├── controllers/      # 控制器(爆炸、剖切、测量等)
│   │   ├── environment/      # 环境管理(地面、天空、灯光)
│   │   ├── loaders/          # 模型加载器
│   │   ├── pipeline/         # 网格处理管道
│   │   ├── scene/            # 场景管理
│   │   └── types/            # 类型定义
│   ├── composables/          # Vue组合式函数
│   ├── pages/                # 页面
│   ├── router/               # 路由配置
│   ├── store/                # 状态管理
│   ├── utils/                # 工具函数
│   ├── types/                # TypeScript类型声明
│   ├── App.vue               # 根组件
│   └── main.ts               # 入口文件
├── index.html                # HTML 模板
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript 配置
└── vite.config.ts            # Vite 配置
```

## 开发指南

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 开发环境运行

```bash
npm run dev
# 或
pnpm dev
```

### 构建生产版本

```bash
npm run build
# 或
pnpm build
```

### 预览生产构建

```bash
npm run preview
# 或
pnpm preview
```

## 模型支持

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| **GLTF/GLB** | `.gltf`, `.glb` | 推荐的 3D 模型格式，支持材质、动画、PBR等 |
| **FBX** | `.fbx` | 支持复杂模型和骨骼动画 |
| **OBJ** | `.obj` | 支持基础几何和材质(MTL) |
| **STL** | `.stl` | 工业3D打印格式，单色模型 |
| **STEP** | `.step`, `.stp` | CAD工程格式，通过 occt-import-js 转换 |
| **IGES** | `.igs`, `.iges` | CAD工程格式，通过 occt-import-js 转换 |

> **注意**: STEP/IGES 格式依赖 WebAssembly 转换，需要浏览器支持 WebAssembly。

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要支持 WebGL 2.0 和 WebAssembly 的现代浏览器。

## 代码规范

- **模块化设计**: 每个文件功能独立，遵循单一职责原则
- **核心引擎**: `src/core/` 目录包含可复用的3D引擎模块，与Vue解耦
- **组合式函数**: 使用 Vue 3 Composition API 封装可复用逻辑
- **类型安全**: 完整的 TypeScript 类型定义和接口
- **代码简洁**: 避免冗余，保持代码清晰易懂
- **BVH优化**: 使用 three-mesh-bvh 进行高性能射线检测

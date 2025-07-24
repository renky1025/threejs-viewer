# 3D 模型查看器

基于 Three.js 和 Vue 3 的 3D 模型查看器，支持多种 3D 模型格式的加载、查看和交互。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件库**: Element Plus
- **3D 渲染**: Three.js
- **构建工具**: Vite
- **状态管理**: Pinia

## 功能特点

- 模型列表展示，支持筛选、分类和搜索
- 支持多种模型格式: OBJ, FBX, GLTF, GLB
- 模型查看功能:
  - 平移、旋转、缩放控制
  - 立方体控制器联动
  - 模型加载进度显示
  - 多种地面材质选择
  - 逼真的天空效果
  - 灯光和阴影效果

## 项目结构

```
threejs-viewer/
├── public/              # 静态资源
│   ├── assets/          # 图片、纹理等资源
│   └── models/          # 3D 模型文件
├── src/
│   ├── assets/          # 项目资源
│   ├── components/      # 组件
│   ├── pages/           # 页面
│   ├── router/          # 路由配置
│   ├── store/           # 状态管理
│   ├── utils/           # 工具函数
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── index.html           # HTML 模板
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
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

- **GLTF/GLB**: 推荐的 3D 模型格式，支持材质、动画等
- **FBX**: 支持复杂模型和动画
- **OBJ**: 支持基础几何和材质

## 代码规范

- 模块化设计，每个文件功能独立
- 组件和工具函数可复用
- 代码简洁易懂，避免冗余
- 完整的代码注释

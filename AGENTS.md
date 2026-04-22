# threejs-viewer 架构说明

## 目录骨架
```text
threejs-viewer/
├── src/
│   ├── core/                      # Three.js 内核分层（场景、加载器、控制器、缓存、管线）
│   │   ├── constraints/           # 场景级空间约束（贴地、边界限制）
│   ├── components/
│   │   ├── AppToast.vue           # 全局提示组件（成功/异常统一浮层提示）
│   │   ├── ModelViewer/           # 模型查看器 UI 与交互面板
│   │   └── PressureViewer/        # 压力数据可视化
│   ├── composables/
│   │   ├── useToast.ts            # 全局 toast 状态与触发工具
│   │   └── index.ts               # composable 对外导出
│   ├── pages/
│   │   ├── Home.vue               # 模型库入口（检索、筛选、上传）
│   │   └── ModelPage.vue          # 模型预览页面（3D/压力数据分流）
│   ├── store/
│   │   └── index.ts               # 模型列表状态与上传模型注册
│   ├── utils/
│   │   ├── threeLoader.ts         # Three.js 场景装配与生命周期
│   │   ├── remoteModel.ts         # 远程模型查询参数解析
│   │   └── modelSource.ts         # 模型来源与类型解析（远程/上传共用）
│   └── router/
│       └── index.ts               # 页面路由
├── public/                        # 静态模型与纹理资源
└── README.md
```

## 模块职责与边界
- `src/core/*`: 只做 Three.js 能力封装，不依赖页面层；上游由 `utils/threeLoader.ts` 统一调用。
- `src/core/constraints/SceneConstraint.ts`: 统一“模型贴地 + 场景边界限制”规则，供拖拽与程序化变换共享。
- `src/components/AppToast.vue`: 提供统一视觉风格的全局通知，承接各页面业务提示。
- `src/composables/useToast.ts`: 提供 toast 队列、自动消失、错误消息提取等全局提示能力。
- `src/utils/threeLoader.ts`: 负责把 `core` 组件装配成可被 Vue 调用的 `ThreeInstance`，并管理渲染循环与资源释放。
- `src/utils/modelSource.ts`: 统一“文件扩展名 -> 模型类型”规则，避免上传与远程解析逻辑重复。
- `src/store/index.ts`: 维护模型目录数据；上传模型注册后可被首页列表与预览页共享。
- `src/pages/Home.vue`: 模型发现入口，负责检索/筛选/上传动作，不直接接触 Three.js。
- `src/pages/ModelPage.vue`: 根据路由参数选择模型并挂载具体查看器，不处理模型解析细节。
- `src/components/ModelViewer/index.vue`: 负责查看器组件生命周期，与 `threeLoader` 对接并承载工具面板。

## 关键依赖流向
- `Home.vue -> store/index.ts -> modelSource.ts`
- `Home.vue / ModelPage.vue -> composables/useToast.ts -> components/AppToast.vue`
- `ModelPage.vue -> ModelViewer/index.vue -> utils/threeLoader.ts -> core/*`
- `ModelPage.vue -> utils/remoteModel.ts -> modelSource.ts`

## 本次架构变更（2026-04-02）
- 新增 `src/utils/modelSource.ts`，抽离模型类型识别与上传模型构建能力。
- 首页接入上传 3D 文件流程，并复用全局 store 模型目录。
- `ModelViewer` 生命周期重构：避免重复初始化，切换模型时先释放旧实例。
- `threeLoader` 与 `SceneManager` 增加渲染性能优化（可见性渲染门控、像素比上限、容器级 resize 监听）。
- 新增场景约束模块并接入变换链路，确保所有模型始终贴地且不可移出场景边界。
- 新增全局 Toast 组件与 composable，统一正常/异常提示通道并替换局部消息提示。

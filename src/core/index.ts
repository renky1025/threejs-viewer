/**
 * Three.js 核心模块统一导出
 */

// 类型定义
export * from './types'

// 场景管理
export { SceneManager } from './scene/SceneManager'

// 模型加载
export { ModelLoader, ModelProcessor } from './loaders/ModelLoader'

// 控制器
export { TransformControllerManager, updateObjectTransform } from './controllers/TransformController'
export type { TransformInfo } from './controllers/TransformController'
export { CubeController, createSimpleCubeControl, VIEW_PRESETS } from './controllers/CubeController'
export { MaterialEditorController } from './controllers/MaterialEditorController'

// 辅助器
export { AxesHelper } from './helpers/AxesHelper'

// 环境
export { LightingManager, setupLighting } from './environment/Lighting'
export { createGround, disposeGround } from './environment/Ground'
export { createRealisticSky, createSolidBackground, createCubeMapSky, disposeSkybox } from './environment/Skybox'
export { SceneGraphBuilder } from './scene/SceneGraphBuilder'
export { EnvironmentManager } from './environment/EnvironmentManager'
export { createSceneConstraint } from './constraints/SceneConstraint'

/**
 * Three.js 核心类型定义
 */
import * as THREE from 'three'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// ==================== 基础类型 ====================

/**
 * 模型文件类型
 */
export type ModelType = 'gltf' | 'glb' | 'obj' | 'fbx' | 'json' | 'stl'

/**
 * 地面类型
 */
export type GroundType = 'material' | 'floor' | 'grass'

/**
 * 变换模式类型
 */
export type TransformMode = 'translate' | 'rotate' | 'scale'

/**
 * 颜色映射类型
 */
export type ColorMapType = 'rainbow' | 'cooltowarm' | 'blackbody' | 'grayscale'

// ==================== 模型相关 ====================

/**
 * 模型数据接口
 */
export interface Model {
  name: string
  type: ModelType
  file: string
  category: string
  thumbnail?: string
}

/**
 * 模型加载回调
 */
export interface ModelLoadCallbacks {
  loading: (progress: number) => void
  loaded: () => void
  error: (error: unknown) => void
}

/**
 * 模型加载结果
 */
export interface ModelLoadResult {
  object: THREE.Object3D
  mixer: THREE.AnimationMixer | null
}

// ==================== 场景相关 ====================

/**
 * 场景配置选项
 */
export interface SceneOptions {
  antialias?: boolean
  alpha?: boolean
  shadowMapEnabled?: boolean
  shadowMapType?: THREE.ShadowMapType
}

/**
 * 相机配置选项
 */
export interface CameraOptions {
  fov?: number
  near?: number
  far?: number
  position?: THREE.Vector3Tuple
}

/**
 * 场景上下文 - 包含场景核心对象
 */
export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  container: HTMLDivElement
}

// ==================== 控制器相关 ====================

/**
 * 变换控制器配置
 */
export interface TransformControllerOptions {
  size?: number
  translationSnap?: number | null
  rotationSnap?: number | null
  scaleSnap?: number | null
}

/**
 * 立方体控制器回调
 */
export type CubeControlCallback = (rotation: { x: number; y: number; z: number }) => void

/**
 * 视角预设
 */
export interface ViewPreset {
  position: number[]
  target: number[]
}

/**
 * 视角预设集合
 */
export interface ViewPresets {
  front: ViewPreset
  back: ViewPreset
  left: ViewPreset
  right: ViewPreset
  top: ViewPreset
  bottom: ViewPreset
}

// ==================== 动画相关 ====================

/**
 * 自动旋转状态
 */
export interface AutoRotateState {
  enabled: boolean
  angle: number
  speed: number
  radius: number
}

/**
 * 立方体动画状态
 */
export interface CubeAnimationState {
  isAnimating: boolean
  progress: number
  duration: number
  startTime: number
  baseRotation: { x: number; y: number; z: number }
  targetRotation: { x: number; y: number; z: number }
}

// ==================== Three.js 实例接口 ====================

/**
 * Three.js 实例接口 - 暴露给组件的 API
 */
export interface ThreeInstance {
  /** 重置视图 */
  resetView: () => void
  /** 添加立方体控制器 */
  addCubeControl: (dom: HTMLDivElement) => void
  /** 初始化立方体控制器 */
  initCubeControl: () => void
  /** 设置变换模式 */
  setTransformMode: (mode: TransformMode) => void
  /** 销毁资源 */
  dispose: () => void
  /** 更新变换 */
  updateTransform: (position: number[], rotation: number[], scale: number) => void
  /** 开始自动旋转 */
  startAutoRotate: () => void
  /** 停止自动旋转 */
  stopAutoRotate: () => void
}

// ==================== 压力数据相关 ====================

/**
 * 压力数据可视化选项
 */
export interface PressureDataOptions {
  colorMap: ColorMapType
  minValue: number
  maxValue: number
}

/**
 * 压力统计数据
 */
export interface PressureStats {
  min: number
  max: number
  avg: number
}

/**
 * 压力数据可视化结果
 */
export interface PressureVisualization {
  mesh: THREE.Mesh
  legend: THREE.Sprite
  updateColorMap: (colorMap: ColorMapType) => void
  updateRange: (min: number, max: number) => void
  dispose: () => void
}

// ==================== 工具类型 ====================

/**
 * 可销毁接口
 */
export interface Disposable {
  dispose: () => void
}

/**
 * 3D 向量元组
 */
export type Vector3Tuple = [number, number, number]

/**
 * 欧拉角元组
 */
export type EulerTuple = [number, number, number]

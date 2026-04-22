/**
 * 变换控制器 - 管理模型的平移、旋转、缩放操作
 */
import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { TransformMode, TransformControllerOptions } from '../types'

/**
 * 默认配置
 */
type ResolvedTransformControllerOptions =
  Required<Omit<TransformControllerOptions, 'constraint'>> &
  Pick<TransformControllerOptions, 'constraint'>

const DEFAULT_OPTIONS: ResolvedTransformControllerOptions = {
  size: 1.0,
  translationSnap: null, // 禁用平移吸附，实现流畅移动
  rotationSnap: null,    // 禁用旋转吸附
  scaleSnap: null,       // 禁用缩放吸附
  constraint: undefined
}

/**
 * 变换控制器管理类
 */
export class TransformControllerManager {
  private transformControls: TransformControls | null = null
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer
  private orbitControls: OrbitControls
  private options: ResolvedTransformControllerOptions
  private onChangeCallback: ((info: TransformInfo) => void) | null = null

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    orbitControls: OrbitControls,
    options: TransformControllerOptions = {}
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * 创建变换控制器并附加到目标对象
   */
  create(target: THREE.Object3D, mode: TransformMode = 'translate'): TransformControls | null {
    // 清理旧控制器
    this.dispose()

    try {
      const controls = new TransformControls(this.camera, this.renderer.domElement)
      
      // 设置模式和大小
      controls.setMode(mode)
      controls.setSize(this.options.size)
      
      // 设置步进值
      controls.setTranslationSnap(this.options.translationSnap)
      controls.setRotationSnap(this.options.rotationSnap)
      controls.setScaleSnap(this.options.scaleSnap)
      
      // 显示所有轴
      controls.showX = true
      controls.showY = true
      controls.showZ = true

      // 拖拽时禁用轨道控制器
      controls.addEventListener('dragging-changed', (event) => {
        this.orbitControls.enabled = !event.value
      })

      // 监听变换事件
      controls.addEventListener('objectChange', () => {
        if (target) {
          this.options.constraint?.(target)
        }
        if (target && this.onChangeCallback) {
          this.onChangeCallback({
            position: target.position.toArray() as [number, number, number],
            rotation: [target.rotation.x, target.rotation.y, target.rotation.z],
            scale: target.scale.x
          })
        }
      })

      // 附加到目标
      controls.attach(target)
      this.scene.add(controls.getHelper())
      this.transformControls = controls

      return controls
    } catch (error) {
      console.error('创建变换控制器失败:', error)
      return null
    }
  }

  /**
   * 设置变换模式
   */
  setMode(mode: TransformMode): void {
    if (this.transformControls) {
      this.transformControls.setMode(mode)
    }
  }

  /**
   * 获取当前模式
   */
  getMode(): TransformMode | null {
    return this.transformControls?.mode as TransformMode | null
  }

  /**
   * 设置变换变化回调
   */
  onChange(callback: (info: TransformInfo) => void): void {
    this.onChangeCallback = callback
  }

  /**
   * 获取控制器实例
   */
  getControls(): TransformControls | null {
    return this.transformControls
  }

  /**
   * 销毁控制器
   */
  dispose(): void {
    if (this.transformControls) {
      try {
        const helper = this.transformControls.getHelper()
        this.transformControls.detach()
        this.scene.remove(helper)
        this.transformControls.dispose()
      } catch (error) {
        console.warn('清理变换控制器失败:', error)
      }
      this.transformControls = null
    }
  }
}

/**
 * 变换信息接口
 */
export interface TransformInfo {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

/**
 * 更新对象变换
 */
export function updateObjectTransform(
  object: THREE.Object3D,
  position?: number[],
  rotation?: number[],
  scale?: number
): void {
  if (position && position.length === 3) {
    object.position.set(
      position[0] ?? object.position.x,
      position[1] ?? object.position.y,
      position[2] ?? object.position.z
    )
  }

  if (rotation && rotation.length === 3) {
    object.rotation.set(
      rotation[0] ?? object.rotation.x,
      rotation[1] ?? object.rotation.y,
      rotation[2] ?? object.rotation.z
    )
  }

  if (scale !== undefined) {
    object.scale.set(scale, scale, scale)
  }
}

/**
 * 场景管理器 - 负责创建和管理 Three.js 场景核心对象
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { SceneContext, SceneOptions, CameraOptions } from '../types'

/**
 * 默认场景配置
 */
const DEFAULT_SCENE_OPTIONS: Required<SceneOptions> = {
  antialias: true,
  alpha: true,
  shadowMapEnabled: true,
  shadowMapType: THREE.PCFSoftShadowMap
}

/**
 * 默认相机配置
 */
const DEFAULT_CAMERA_OPTIONS: Required<CameraOptions> = {
  fov: 60,
  near: 0.1,
  far: 1000,
  position: [0, 2, 5]
}

/**
 * 场景管理器类
 */
export class SceneManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private container: HTMLDivElement
  private animationId: number | null = null
  private resizeHandler: (() => void) | null = null

  constructor(
    container: HTMLDivElement,
    sceneOptions: SceneOptions = {},
    cameraOptions: CameraOptions = {}
  ) {
    this.container = container
    
    // 合并配置
    const sceneOpts = { ...DEFAULT_SCENE_OPTIONS, ...sceneOptions }
    const cameraOpts = { ...DEFAULT_CAMERA_OPTIONS, ...cameraOptions }

    // 创建场景
    this.scene = new THREE.Scene()

    // 创建相机
    const aspect = container.clientWidth / container.clientHeight
    this.camera = new THREE.PerspectiveCamera(
      cameraOpts.fov,
      aspect,
      cameraOpts.near,
      cameraOpts.far
    )
    this.camera.position.set(...cameraOpts.position)

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: sceneOpts.antialias,
      alpha: sceneOpts.alpha
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.shadowMap.enabled = sceneOpts.shadowMapEnabled
    this.renderer.shadowMap.type = sceneOpts.shadowMapType
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // 清空容器并添加渲染器
    container.innerHTML = ''
    container.appendChild(this.renderer.domElement)

    // 创建轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.setupControls()

    // 设置窗口大小变化监听
    this.setupResizeHandler()
  }

  /**
   * 设置轨道控制器参数
   */
  private setupControls(): void {
    // 启用阻尼（惯性）效果
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08 // 阻尼系数，值越小惯性越大
    
    // 旋转速度
    this.controls.rotateSpeed = 0.5 // 降低旋转速度
    
    // 平移速度
    this.controls.panSpeed = 0.5 // 降低平移速度
    
    // 缩放速度
    this.controls.zoomSpeed = 0.8
    
    // 屏幕空间平移
    this.controls.screenSpacePanning = true
    
    // 距离限制
    this.controls.minDistance = 1
    this.controls.maxDistance = 200
    
    // 防止极点穿透
    this.controls.minPolarAngle = 0.01
    this.controls.maxPolarAngle = Math.PI - 0.01
    
    // 启用自动旋转（默认关闭，可通过 API 开启）
    this.controls.autoRotate = false
    this.controls.autoRotateSpeed = 0.5 // 自动旋转速度
  }

  /**
   * 设置窗口大小变化处理
   */
  private setupResizeHandler(): void {
    this.resizeHandler = () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    }
    window.addEventListener('resize', this.resizeHandler)
  }

  /**
   * 获取场景上下文
   */
  getContext(): SceneContext {
    return {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      controls: this.controls,
      container: this.container
    }
  }

  /**
   * 获取场景
   */
  getScene(): THREE.Scene {
    return this.scene
  }

  /**
   * 获取相机
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  /**
   * 获取渲染器
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  /**
   * 获取控制器
   */
  getControls(): OrbitControls {
    return this.controls
  }

  /**
   * 渲染一帧
   */
  render(): void {
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * 重置视图
   */
  resetView(position: THREE.Vector3Tuple = [0, 2, 5], target: THREE.Vector3Tuple = [0, 1, 0]): void {
    this.camera.position.set(...position)
    this.controls.target.set(...target)
    this.controls.update()
  }

  /**
   * 平滑切换相机视角
   */
  animateCameraTo(
    targetPosition: number[],
    targetLookAt: number[],
    duration: number = 1000
  ): void {
    const startPosition = this.camera.position.clone()
    const startTarget = this.controls.target.clone()
    const endPosition = new THREE.Vector3(targetPosition[0], targetPosition[1], targetPosition[2])
    const endTarget = new THREE.Vector3(targetLookAt[0], targetLookAt[1], targetLookAt[2])
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // 缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      this.camera.position.lerpVectors(startPosition, endPosition, easeProgress)
      this.controls.target.lerpVectors(startTarget, endTarget, easeProgress)
      this.controls.update()

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }

  /**
   * 销毁资源
   */
  dispose(): void {
    // 停止动画
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    // 移除事件监听
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }

    // 清理场景中的所有对象
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      }
    })

    // 清理控制器和渲染器
    this.controls.dispose()
    this.renderer.dispose()
  }
}

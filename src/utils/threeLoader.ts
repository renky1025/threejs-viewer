/**
 * Three.js 模型加载器 - 重构版本
 * 使用核心模块实现模型加载和场景管理
 */
import * as THREE from 'three'
import {
  SceneManager,
  ModelLoader,
  ModelProcessor,
  TransformControllerManager,
  CubeController,
  createSimpleCubeControl,
  setupLighting,
  createGround,
  createRealisticSky,
  updateObjectTransform
} from '../core'
import type {
  Model,
  GroundType,
  ThreeInstance,
  TransformMode,
  ModelLoadCallbacks
} from '../core/types'

/**
 * 加载3D模型
 * @param container 容器DOM元素
 * @param model 模型信息
 * @param ground 地面类型
 * @param callbacks 回调函数对象
 * @returns Three.js实例接口
 */
export async function loadModel(
  container: HTMLDivElement,
  model: Model,
  ground: GroundType,
  callbacks: ModelLoadCallbacks
): Promise<ThreeInstance> {
  // ==================== 状态变量 ====================
  let autoRotate = false // 默认关闭自动旋转，避免干扰用户操作
  const autoRotateSpeed = 0.005 // 模型自转速度
  let group: THREE.Group | null = null
  let object: THREE.Object3D | null = null
  let mixer: THREE.AnimationMixer | null = null
  const clock = new THREE.Clock()
  let animationId: number
  let cleanupCubeControl: (() => void) | null = null
  let cubeController: CubeController | null = null

  // ==================== 自动旋转控制 ====================
  function startAutoRotate() {
    autoRotate = true
  }

  function stopAutoRotate() {
    autoRotate = false
  }

  // ==================== 初始化场景 ====================
  const sceneManager = new SceneManager(container)
  const { scene, camera, renderer, controls } = sceneManager.getContext()

  // 添加天空盒
  createRealisticSky(scene)

  // 添加地面
  createGround(scene, ground)

  // 设置灯光
  setupLighting(scene)

  // ==================== 加载模型 ====================
  const modelLoader = new ModelLoader()

  try {
    const result = await modelLoader.load(model, callbacks)
    object = result.object
    mixer = result.mixer

    if (!object) {
      throw new Error('模型加载失败')
    }

    callbacks.loading(80)

    // 创建 Group 包裹模型
    group = new THREE.Group()
    ModelProcessor.centerModel(object)
    group.add(object)
    scene.add(group)

    // 设置阴影
    ModelProcessor.setupShadows(object)

    // 自动调整模型大小
    ModelProcessor.autoScale(object)

    // 模型底部贴地
    ModelProcessor.groundModel(object)

    // 不再添加地板坐标轴，TransformControls 已经提供了移动坐标

    callbacks.loading(100)
    callbacks.loaded()

    // 加载完成后自动创建变换控制器
    setTimeout(() => {
      createTransformControls('translate')
    }, 100)
  } catch (error) {
    console.error('模型加载失败:', error)
    callbacks.error(error)
    throw error
  }

  // ==================== 变换控制器 ====================
  const transformManager = new TransformControllerManager(
    scene,
    camera,
    renderer,
    controls
  )

  function createTransformControls(mode: TransformMode = 'translate') {
    if (!group) {
      console.warn('无法创建变换控制器: 模型组不存在')
      return null
    }

    // 将 TransformControls 附加到 group
    const transformControls = transformManager.create(group, mode)
    if (transformControls) {
      // 拖拽时停止自动旋转
      transformControls.addEventListener('dragging-changed', (event) => {
        if (event.value) {
          autoRotate = false
        }
      })
      transformManager.onChange((info) => {
        console.log('模型变换完成:', info)
      })
    }
    return transformControls
  }

  function setTransformMode(mode: TransformMode) {
    try {
      if (transformManager.getControls()) {
        transformManager.setMode(mode)
      } else {
        createTransformControls(mode)
      }
    } catch (error) {
      console.error('设置变换模式失败:', error)
    }
  }

  // ==================== 立方体控制器 ====================
  function initCubeControl() {
    if (!object) return

    cubeController = new CubeController(container, camera, controls)
    
    if (group) {
      cubeController.setMainGroup(group)
    }

    cubeController.setCameraAnimateCallback((position, target) => {
      sceneManager.animateCameraTo(position, target)
    })
  }

  function addCubeControl(dom: HTMLDivElement) {
    if (!dom || !object) return

    if (cleanupCubeControl) {
      cleanupCubeControl()
    }

    cleanupCubeControl = createSimpleCubeControl(dom, (rotation) => {
      if (object) {
        object.rotation.x = rotation.x
        object.rotation.y = rotation.y
        object.rotation.z = rotation.z
      }
    })
  }

  // ==================== 动画循环 ====================
  function animate() {
    animationId = requestAnimationFrame(animate)

    // 自动旋转模型（仅在没有用户交互时生效）
    const transformControls = transformManager.getControls()
    const isDraggingTransform = transformControls?.dragging ?? false
    
    if (autoRotate && group && !isDraggingTransform) {
      // 旋转模型本身，而不是相机
      group.rotation.y += autoRotateSpeed
    }

    controls.update()

    if (mixer) {
      const delta = clock.getDelta()
      mixer.update(delta)
    }

    renderer.render(scene, camera)
  }

  animate()

  // ==================== 复位视图 ====================
  function resetView() {
    // 重置相机位置
    sceneManager.resetView()
    
    // 重置模型位置和旋转
    if (object) {
      object.position.set(0, 0, 0)
      ModelProcessor.groundModel(object)
    }
    if (group) {
      group.rotation.set(0, 0, 0)
    }
  }

  // ==================== 更新变换 ====================
  function updateTransform(position: number[], rotation: number[], scale: number) {
    if (group) {
      updateObjectTransform(group, position, rotation, scale)
    }
  }

  // ==================== 销毁资源 ====================
  function dispose() {
    // 停止动画
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    // 清理立方体控制器
    if (cubeController) {
      cubeController.dispose()
      cubeController = null
    }

    if (cleanupCubeControl) {
      cleanupCubeControl()
      cleanupCubeControl = null
    }

    // 清理变换控制器
    transformManager.dispose()

    // 移除 group
    if (group && scene.children.includes(group)) {
      scene.remove(group)
    }

    // 清理场景管理器
    sceneManager.dispose()

    // 断开引用
    group = null
    object = null
    mixer = null
  }

  // ==================== 返回实例接口 ====================
  return {
    resetView,
    addCubeControl,
    initCubeControl,
    setTransformMode,
    dispose,
    updateTransform,
    startAutoRotate,
    stopAutoRotate
  }
}

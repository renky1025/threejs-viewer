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
  updateObjectTransform,
  SceneGraphBuilder,
  EnvironmentManager,
  MaterialEditorController
} from '../core'
import { prepareRemoteModel } from '../core/cache/RemoteModelLoader'
import { ClippingController } from '../core/controllers/ClippingController'
import { ExplodedViewController } from '../core/controllers/ExplodedViewController'
import { MeasureController } from '../core/controllers/MeasureController'
import type {
  Model,
  GroundType,
  ThreeInstance,
  TransformMode,
  ModelLoadCallbacks,
  ClippingAxis,
  MaterialEditOptions,
  MaterialProperties
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
  let remoteBlobUrl: string | null = null
  let clippingController: ClippingController | null = null
  let explodedController: ExplodedViewController | null = null
  let measureController: MeasureController | null = null
  let envManager: EnvironmentManager | null = null
  let materialEditor: MaterialEditorController | null = null
  const uuidMap = new Map<string, THREE.Object3D>()

  // ==================== 自动旋转控制 ====================
  function startAutoRotate() {
    autoRotate = true
  }

  function rebuildUuidMap() {
    uuidMap.clear()
    if (group) {
      group.traverse((obj) => {
        uuidMap.set(obj.uuid, obj)
      })
    }
  }

  function getSceneGraph() {
    if (!group) return []
    return SceneGraphBuilder.build(group)
  }

  function applyNodeVisibility(id: string, visible: boolean) {
    const obj = uuidMap.get(id)
    if (!obj) return
    obj.visible = visible
  }

  function applyNodeOpacity(id: string, opacity: number) {
    const obj = uuidMap.get(id)
    if (!obj) return

    const clamped = THREE.MathUtils.clamp(opacity, 0, 1)

    obj.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      const newMaterials = materials.map((mat) => {
        if (!mat) return mat
        const anyMat = mat as any
        let targetMat = mat
        if (!anyMat.userData) {
          anyMat.userData = {}
        }
        if (!anyMat.userData.__ftmiCloned) {
          targetMat = mat.clone()
          anyMat.userData.__ftmiCloned = true
        }
        const stdMat = targetMat as THREE.MeshStandardMaterial
        stdMat.transparent = clamped < 1
        stdMat.opacity = clamped
        return targetMat
      })

      if (Array.isArray(mesh.material)) {
        mesh.material = newMaterials as THREE.Material[]
      } else {
        mesh.material = newMaterials[0] as THREE.Material
      }
    })
  }

  function applyNodeLock(id: string, locked: boolean) {
    const obj = uuidMap.get(id)
    if (!obj) return
    obj.traverse((child) => {
      const anyChild = child as any
      if (!anyChild.userData) {
        anyChild.userData = {}
      }
      anyChild.userData.locked = locked
    })
  }

  function setClippingPlane(axis: ClippingAxis, t: number) {
    if (clippingController) {
      clippingController.setAxisPlane(axis, t)
    }
  }

  function toggleClippingAxis(axis: ClippingAxis, enabled: boolean) {
    if (clippingController) {
      clippingController.toggleAxis(axis, enabled)
    }
  }

  function resetClipping() {
    if (clippingController) {
      clippingController.reset()
    }
  }

  function stopAutoRotate() {
    autoRotate = false
  }

  // ==================== 初始化场景 ====================
  const sceneManager = new SceneManager(container)
  const { scene, camera, renderer, controls } = sceneManager.getContext()

  // 添加地面
  createGround(scene, ground)

  // 设置灯光
  setupLighting(scene)

  // 环境
  envManager = new EnvironmentManager(renderer, scene)
  envManager.setupSkyEnvironment()

  function focusCameraOnGroup(target: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(target)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
    const distance = (maxDim * 1.5) / Math.tan(halfFov)

    const dir = new THREE.Vector3(0, 1, 2).normalize()
    const newPos = center.clone().addScaledVector(dir, distance)

    camera.position.copy(newPos)
    controls.target.copy(center)
    controls.update()
  }

  // ==================== 创建 bbox 占位符 ====================
  let bboxPlaceholder: THREE.Group | null = ModelProcessor.createBboxPlaceholder()
  scene.add(bboxPlaceholder)

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

    const transformControls = transformManager.create(group, mode)
    if (transformControls) {
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
      group.rotation.y += autoRotateSpeed
    }

    if (mixer) {
      const delta = clock.getDelta()
      mixer.update(delta)
    }

    sceneManager.render()
  }

  // 立即开始渲染（场景已有天空盒、地面、灯光和 bbox）
  animate()

  // ==================== 加载模型 ====================
  const modelLoader = new ModelLoader()

  try {
    let effectiveModel = model

    if (model.source === 'remote') {
      try {
        const prepared = await prepareRemoteModel(model)
        effectiveModel = prepared.model
        if (prepared.blobUrl) {
          remoteBlobUrl = prepared.blobUrl
        }
      } catch (error) {
        console.error('远程模型预处理失败:', error)
        callbacks.error(error)
        throw error
      }
    }

    const result = await modelLoader.load(effectiveModel, callbacks)
    object = result.object
    mixer = result.mixer

    if (!object) {
      throw new Error('模型加载失败')
    }

    callbacks.loading(80)

    // 创建 Group 包裹模型，并在 Group 上做归一化处理，保证整体在世界原点附近
    group = new THREE.Group()
    group.add(object)

    // 设置阴影
    ModelProcessor.setupShadows(group)

    // 以 group 为整体进行居中、缩放和贴地
    ModelProcessor.centerModel(group)
    ModelProcessor.autoScale(group)
    ModelProcessor.groundModel(group)

    // 更新 bbox 到实际模型尺寸
    if (bboxPlaceholder) {
      ModelProcessor.updateBboxFromModel(bboxPlaceholder, group)
    }

    focusCameraOnGroup(group)

    if (group) {
      clippingController = new ClippingController(renderer, group)
      explodedController = new ExplodedViewController(group)
      materialEditor = new MaterialEditorController(group)
      rebuildUuidMap()
    }

    callbacks.loading(90)

    // 添加模型到场景 (初始透明)
    scene.add(group)

    // 淡出 bbox 并渐进显示模型
    await Promise.all([
      bboxPlaceholder ? ModelProcessor.fadeOutBbox(bboxPlaceholder, 400) : Promise.resolve(),
      ModelProcessor.revealModel(group, 600)
    ])
    bboxPlaceholder = null

    callbacks.loading(100)
    callbacks.loaded()

    // 针对 STEP/IGES 模型，加载完成后自动复位视图，
    // 避免初始视角异常导致模型显示为全黑，需要手动点击“重置视图”才能恢复
    if (effectiveModel.type === 'step' || effectiveModel.type === 'iges') {
      resetView()
    }

    // 加载完成后自动创建变换控制器
    setTimeout(() => {
      createTransformControls('translate')
    }, 100)
  } catch (error) {
    // 清理 bbox
    if (bboxPlaceholder) {
      scene.remove(bboxPlaceholder)
      bboxPlaceholder = null
    }
    console.error('模型加载失败:', error)
    callbacks.error(error)
    throw error
  }

  // ==================== 复位视图 ====================
  function resetView() {
    // 重置相机位置
    sceneManager.resetView()
    
    // 重置模型位置和旋转（以 group 为整体归一化到原点平面附近）
    if (group) {
      group.position.set(0, 0, 0)
      group.rotation.set(0, 0, 0)
      ModelProcessor.groundModel(group)
    }
  }

  // ==================== 更新变换 ====================
  function updateTransform(position: number[], rotation: number[], scale: number) {
    if (group) {
      updateObjectTransform(group, position, rotation, scale)
    }
  }

  function enableMeasure() {
    if (!group) return
    if (!measureController) {
      measureController = new MeasureController(camera, container, group)
    }
    measureController.enable()
  }

  function disableMeasure() {
    if (!measureController) return
    measureController.disable()
  }

  function clearMeasure() {
    if (!measureController) return
    measureController.clear()
  }

  function getMeasureResult() {
    if (!measureController) {
      return { points: [], distance: null }
    }
    return measureController.getResult()
  }

  function setMaterialProperties(id: string, props: MaterialEditOptions) {
    if (!materialEditor) return
    materialEditor.setProperties(id, props)
  }

  function getMaterialProperties(id: string): MaterialProperties | null {
    if (!materialEditor) return null
    return materialEditor.getProperties(id)
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

    if (clippingController) {
      clippingController.dispose()
      clippingController = null
    }

    if (explodedController) {
      explodedController.dispose()
      explodedController = null
    }

    if (envManager) {
      envManager.dispose()
      envManager = null
    }

    if (measureController) {
      measureController.dispose()
      measureController = null
    }

    if (materialEditor) {
      materialEditor.dispose()
      materialEditor = null
    }

    // 释放远程模型的 blob URL
    if (remoteBlobUrl) {
      URL.revokeObjectURL(remoteBlobUrl)
      remoteBlobUrl = null
    }

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
    stopAutoRotate,
    setClippingPlane,
    toggleClippingAxis,
    resetClipping,
    setExplodeFactor: (factor: number) => {
      if (explodedController) {
        explodedController.setFactor(factor)
      }
    },
    resetExplode: () => {
      if (explodedController) {
        explodedController.reset()
      }
    },
    getSceneGraph,
    applyNodeVisibility,
    applyNodeOpacity,
    applyNodeLock,
    enableMeasure,
    disableMeasure,
    clearMeasure,
    getMeasureResult,
    setMaterialProperties,
    getMaterialProperties
  }
}

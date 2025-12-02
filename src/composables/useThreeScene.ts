/**
 * Three.js 场景 Composable
 * 提供 Vue 组件中使用 Three.js 场景的可复用逻辑
 */
import { ref, onBeforeUnmount, type Ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export interface UseThreeSceneOptions {
  /** 相机视角 */
  fov?: number
  /** 近裁剪面 */
  near?: number
  /** 远裁剪面 */
  far?: number
  /** 初始相机位置 */
  cameraPosition?: [number, number, number]
  /** 是否启用抗锯齿 */
  antialias?: boolean
  /** 背景颜色 */
  backgroundColor?: number
}

export interface ThreeSceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
}

/**
 * Three.js 场景 Composable
 */
export function useThreeScene(
  containerRef: Ref<HTMLDivElement | undefined>,
  options: UseThreeSceneOptions = {}
) {
  const {
    fov = 60,
    near = 0.1,
    far = 1000,
    cameraPosition = [0, 0, 10],
    antialias = true,
    backgroundColor = 0xffffff
  } = options

  const isInitialized = ref(false)
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let controls: OrbitControls | null = null
  let animationId: number | null = null
  let renderCallback: (() => void) | null = null

  /**
   * 初始化场景
   */
  function init(): ThreeSceneContext | null {
    const container = containerRef.value
    if (!container) return null

    // 创建场景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(backgroundColor)

    // 创建相机
    const width = container.clientWidth
    const height = container.clientHeight
    camera = new THREE.PerspectiveCamera(fov, width / height, near, far)
    camera.position.set(...cameraPosition)

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    // 创建控制器
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // 监听窗口大小变化
    window.addEventListener('resize', onResize)

    isInitialized.value = true

    return { scene, camera, renderer, controls }
  }

  /**
   * 窗口大小变化处理
   */
  function onResize() {
    const container = containerRef.value
    if (!container || !camera || !renderer) return

    const width = container.clientWidth
    const height = container.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  /**
   * 渲染一帧
   */
  function render() {
    if (!renderer || !scene || !camera) return
    renderer.render(scene, camera)
  }

  /**
   * 开始动画循环
   */
  function startAnimationLoop(callback?: () => void) {
    renderCallback = callback || null

    function animate() {
      animationId = requestAnimationFrame(animate)

      if (controls) {
        controls.update()
      }

      if (renderCallback) {
        renderCallback()
      }

      render()
    }

    animate()
  }

  /**
   * 停止动画循环
   */
  function stopAnimationLoop() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  /**
   * 重置视图
   */
  function resetView(
    position: [number, number, number] = cameraPosition,
    target: [number, number, number] = [0, 0, 0]
  ) {
    if (camera && controls) {
      camera.position.set(...position)
      controls.target.set(...target)
      controls.update()
    }
  }

  /**
   * 获取场景上下文
   */
  function getContext(): ThreeSceneContext | null {
    if (!scene || !camera || !renderer || !controls) return null
    return { scene, camera, renderer, controls }
  }

  /**
   * 销毁资源
   */
  function dispose() {
    stopAnimationLoop()
    window.removeEventListener('resize', onResize)

    if (controls) {
      controls.dispose()
      controls = null
    }

    if (renderer) {
      renderer.dispose()
      renderer = null
    }

    if (scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose())
            } else {
              object.material.dispose()
            }
          }
        }
      })
      scene = null
    }

    camera = null
    isInitialized.value = false
  }

  // 生命周期钩子
  onBeforeUnmount(dispose)

  return {
    isInitialized,
    init,
    render,
    startAnimationLoop,
    stopAnimationLoop,
    resetView,
    getContext,
    dispose
  }
}

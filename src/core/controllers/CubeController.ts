/**
 * 立方体控制器 - 用于控制模型旋转的辅助 Cube
 * 
 * 联动规则（根据 README-CUBE.md）：
 * 1. 模型转动 → Cube 跟随：cube.rotation = model.rotation
 * 2. Cube 转动 → 模型跟随：model.rotation = cube.rotation
 * 3. 使用 isUpdating 状态变量避免循环同步
 */
import * as THREE from 'three'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { ViewPresets, CubeControlCallback } from '../types'

/**
 * 视角预设
 */
export const VIEW_PRESETS: ViewPresets = {
  front: { position: [0, 0, 5], target: [0, 0, 0] },
  back: { position: [0, 0, -5], target: [0, 0, 0] },
  left: { position: [-5, 0, 0], target: [0, 0, 0] },
  right: { position: [5, 0, 0], target: [0, 0, 0] },
  top: { position: [0, 5, 0], target: [0, 0, 0] },
  bottom: { position: [0, -5, 0], target: [0, 0, 0] }
}

/**
 * 立方体控制器配置
 */
export interface CubeControllerOptions {
  size?: number
  position?: { top: number; right: number }
}

/**
 * 立方体控制器类
 */
export class CubeController {
  private container: HTMLDivElement
  private cubeContainer: HTMLDivElement | null = null
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private cube: THREE.Mesh
  private animationId: number | null = null
  
  // 主场景引用
  private mainCamera: THREE.PerspectiveCamera
  private mainControls: OrbitControls
  
  // 鼠标交互状态
  private isMouseDown = false
  private mouseX = 0
  private mouseY = 0
  private hasDragged = false

  // 相机动画回调
  private onCameraAnimate: ((position: number[], target: number[]) => void) | null = null

  constructor(
    container: HTMLDivElement,
    mainCamera: THREE.PerspectiveCamera,
    mainControls: OrbitControls,
    options: CubeControllerOptions = {}
  ) {
    this.container = container
    this.mainCamera = mainCamera
    this.mainControls = mainControls

    const size = options.size ?? 160 // CAD software usually uses smaller cubes
    const position = options.position ?? { top: 20, right: 20 }

    // 创建立方体场景
    this.scene = new THREE.Scene()
    
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10)
    this.camera.position.set(2, 1.5, 3)
    this.camera.lookAt(0, 0, 0)

    // 创建立方体
    this.cube = this.createCube()
    this.scene.add(this.cube)

    // 添加灯光
    this.setupLights()

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    this.renderer.setSize(size, size)
    this.renderer.setClearColor(0x000000, 0)

    // 创建容器
    this.cubeContainer = document.createElement('div')
    this.cubeContainer.style.cssText = `
      position: absolute;
      top: ${position.top}px;
      right: ${position.right}px;
      width: ${size}px;
      height: ${size}px;
      z-index: 100;
      cursor: grab;
      user-select: none;
    `
    this.cubeContainer.title = '拖拽旋转立方体，Shift+拖拽旋转场景，点击面切换视角'
    this.cubeContainer.appendChild(this.renderer.domElement)
    container.appendChild(this.cubeContainer)

    // 设置事件监听
    this.setupEventListeners()

    // 开始动画
    this.animate()
  }

  /**
   * 创建带标签的立方体
   */
  private createCube(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const materials = [
      this.createLabeledFace(0xff0000, '右'),
      this.createLabeledFace(0x00ff00, '左'),
      this.createLabeledFace(0x0000ff, '上'),
      this.createLabeledFace(0x000000, '下'),
      this.createLabeledFace(0xff00ff, '前'),
      this.createLabeledFace(0x00ffff, '后')
    ]
    return new THREE.Mesh(geometry, materials)
  }

  /**
   * 创建带标签的面材质
   */
  private createLabeledFace(color: number, label: string): THREE.MeshBasicMaterial {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')
    
    if (!context) {
      return new THREE.MeshBasicMaterial({ color })
    }

    // 填充背景
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`
    context.fillRect(0, 0, 128, 128)

    // 添加文字
    context.font = 'bold 40px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = '#ffffff'
    context.fillText(label, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    })
  }

  /**
   * 设置灯光
   */
  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(1, 1, 1)
    this.scene.add(directionalLight)
  }

  // 绑定的事件处理函数引用（用于移除事件监听）
  private boundOnMouseDown!: (event: MouseEvent) => void
  private boundOnMouseMove!: (event: MouseEvent) => void
  private boundOnMouseUp!: () => void
  private boundOnClick!: (event: MouseEvent) => void

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    if (!this.cubeContainer) return

    // 绑定事件处理函数
    this.boundOnMouseDown = this.onMouseDown.bind(this)
    this.boundOnMouseMove = this.onMouseMove.bind(this)
    this.boundOnMouseUp = this.onMouseUp.bind(this)
    this.boundOnClick = this.onClick.bind(this)

    // mousedown 和 click 绑定到容器
    this.cubeContainer.addEventListener('mousedown', this.boundOnMouseDown)
    this.cubeContainer.addEventListener('click', this.boundOnClick)
    
    // mousemove 和 mouseup 绑定到 document，确保鼠标移出容器后仍能响应
    document.addEventListener('mousemove', this.boundOnMouseMove)
    document.addEventListener('mouseup', this.boundOnMouseUp)
  }

  /**
   * 鼠标按下事件
   */
  private onMouseDown(event: MouseEvent): void {
    this.isMouseDown = true
    this.hasDragged = false
    this.mouseX = event.clientX
    this.mouseY = event.clientY
    if (this.cubeContainer) {
      this.cubeContainer.style.cursor = 'grabbing'
    }
    event.preventDefault()
  }

  /**
   * 鼠标移动事件
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isMouseDown) return

    const deltaX = event.clientX - this.mouseX
    const deltaY = event.clientY - this.mouseY

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      this.hasDragged = true

      if (event.shiftKey) {
        // Shift + 拖拽：旋转主相机
        this.rotateMainCamera(deltaX, deltaY)
      } else {
        // 普通拖拽：旋转立方体
        this.rotateCube(deltaX, deltaY)
      }
    }

    this.mouseX = event.clientX
    this.mouseY = event.clientY
  }

  /**
   * 鼠标释放事件
   */
  private onMouseUp(): void {
    this.isMouseDown = false
    if (this.cubeContainer) {
      this.cubeContainer.style.cursor = 'grab'
    }
    setTimeout(() => {
      this.hasDragged = false
    }, 100)
  }

  /**
   * 点击事件
   */
  private onClick(event: MouseEvent): void {
    if (this.hasDragged || !this.cubeContainer) return

    const rect = this.cubeContainer.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)
    const intersects = raycaster.intersectObject(this.cube)

    if (intersects.length > 0) {
      const faceIndex = (intersects[0] as any).face?.materialIndex ?? 4
      this.switchToView(faceIndex)
    }
  }

  /**
   * 旋转主相机（Shift+拖拽时使用）
   */
  private rotateMainCamera(deltaX: number, deltaY: number): void {
    const rotationSpeed = 0.005
    const spherical = new THREE.Spherical()
    const offset = this.mainCamera.position.clone().sub(this.mainControls.target)
    
    spherical.setFromVector3(offset)
    spherical.theta -= deltaX * rotationSpeed
    spherical.phi += deltaY * rotationSpeed
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
    
    offset.setFromSpherical(spherical)
    this.mainCamera.position.copy(this.mainControls.target).add(offset)
    this.mainControls.update()
  }

  /**
   * 拖拽 Cube 时旋转主相机视角
   * Cube 作为导航指示器，拖拽它来改变相机视角
   */
  private rotateCube(deltaX: number, deltaY: number): void {
    // 拖拽 Cube 时旋转相机视角
    this.rotateMainCamera(deltaX, deltaY)
  }

  /**
   * 点击 Cube 面切换相机视角
   */
  private switchToView(faceIndex: number): void {
    const viewMap: Record<number, keyof ViewPresets> = {
      0: 'right',
      1: 'left',
      2: 'top',
      3: 'bottom',
      4: 'front',
      5: 'back'
    }

    const viewName = viewMap[faceIndex] ?? 'front'
    const preset = VIEW_PRESETS[viewName]

    // 计算相机到目标的距离，保持当前距离
    const currentDistance = this.mainCamera.position.distanceTo(this.mainControls.target)
    const pos = preset.position
    const scaledPosition = [
      (pos[0] ?? 0) * currentDistance / 5,
      (pos[1] ?? 0) * currentDistance / 5,
      (pos[2] ?? 0) * currentDistance / 5
    ]

    // 触发相机动画
    if (this.onCameraAnimate) {
      this.onCameraAnimate(scaledPosition, preset.target)
    }
  }

  /**
   * 设置相机动画回调
   */
  setCameraAnimateCallback(callback: (position: number[], target: number[]) => void): void {
    this.onCameraAnimate = callback
  }

  /**
   * 设置主场景 Group 引用（保留接口兼容性）
   */
  setMainGroup(_group: THREE.Group): void {
    // 现在使用相机方向同步，不再需要 group 引用
  }

  /**
   * 动画循环
   */
  private animate(): void {
    if (!this.renderer) return

    this.animationId = requestAnimationFrame(() => this.animate())

    // Cube 跟随相机方向（不跟随模型旋转）
    this.syncCubeWithCamera()

    // 渲染
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Cube 跟随主相机方向
   * Cube.quaternion 与 Camera.quaternion 同步（反向，因为 Cube 显示的是"从相机看向场景"的方向）
   */
  private syncCubeWithCamera(): void {
    // 计算相机相对于目标点的方向
    const cameraDirection = new THREE.Vector3()
    cameraDirection.subVectors(this.mainCamera.position, this.mainControls.target).normalize()
    
    // 创建一个临时相机来计算旋转
    const tempCamera = new THREE.PerspectiveCamera()
    tempCamera.position.copy(cameraDirection.multiplyScalar(3))
    tempCamera.lookAt(0, 0, 0)
    
    // 获取相机的四元数并应用到立方体（反向）
    const quaternion = tempCamera.quaternion.clone()
    this.cube.quaternion.copy(quaternion).invert()
  }


  /**
   * 销毁资源
   */
  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    // 移除事件监听
    if (this.cubeContainer) {
      this.cubeContainer.removeEventListener('mousedown', this.boundOnMouseDown)
      this.cubeContainer.removeEventListener('click', this.boundOnClick)
    }
    document.removeEventListener('mousemove', this.boundOnMouseMove)
    document.removeEventListener('mouseup', this.boundOnMouseUp)

    if (this.cubeContainer && this.container.contains(this.cubeContainer)) {
      this.container.removeChild(this.cubeContainer)
    }

    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }

    this.cubeContainer = null
  }
}

/**
 * 创建简单的立方体控制器（用于外部小窗口）
 */
export function createSimpleCubeControl(
  container: HTMLElement,
  callback: CubeControlCallback
): () => void {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10)
  camera.position.set(2, 1.5, 3)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(120, 120)
  renderer.setClearColor(0x000000, 0)

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    new THREE.MeshBasicMaterial({ color: 0x0000ff }),
    new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    new THREE.MeshBasicMaterial({ color: 0xff00ff }),
    new THREE.MeshBasicMaterial({ color: 0x00ffff })
  ]

  const cube = new THREE.Mesh(geometry, materials)
  scene.add(cube)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  container.appendChild(renderer.domElement)

  let isMouseDown = false
  let mouseX = 0
  let mouseY = 0

  const onMouseDown = (event: MouseEvent) => {
    isMouseDown = true
    mouseX = event.clientX
    mouseY = event.clientY
  }

  const onMouseMove = (event: MouseEvent) => {
    if (!isMouseDown) return

    const deltaX = event.clientX - mouseX
    const deltaY = event.clientY - mouseY

    cube.rotation.y += deltaX * 0.01
    cube.rotation.x += deltaY * 0.01

    callback({
      x: cube.rotation.x,
      y: cube.rotation.y,
      z: cube.rotation.z
    })

    mouseX = event.clientX
    mouseY = event.clientY

    renderer.render(scene, camera)
  }

  const onMouseUp = () => {
    isMouseDown = false
  }

  renderer.domElement.addEventListener('mousedown', onMouseDown)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)

  renderer.render(scene, camera)

  // 返回清理函数
  return () => {
    renderer.domElement.removeEventListener('mousedown', onMouseDown)
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)

    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement)
    }

    geometry.dispose()
    materials.forEach(material => material.dispose())
    renderer.dispose()
  }
}

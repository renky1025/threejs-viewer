/**
 * 三轴辅助器 - 显示在屏幕右上角的坐标轴指示器
 * 使用 Three.js 的 AxesHelper 作为基础，添加标签
 */
import * as THREE from 'three'

/**
 * 屏幕空间三轴辅助器类
 */
export class AxesHelper {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private container: HTMLDivElement
  private axesGroup: THREE.Group
  private pixelRatio: number

  constructor(container: HTMLDivElement, size: number = 80) {
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

    // 创建容器 - 定位在右上角
    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: ${size}px;
      height: ${size}px;
      z-index: 1000;
      pointer-events: none;
    `
    container.appendChild(this.container)

    // 创建独立场景 - 透明背景
    this.scene = new THREE.Scene()
    // 场景背景透明
    this.scene.background = null

    // 创建正交相机
    const halfSize = size / 2
    this.camera = new THREE.OrthographicCamera(-halfSize, halfSize, halfSize, -halfSize, 0.1, 1000)
    this.camera.position.set(0, 0, 100)
    this.camera.lookAt(0, 0, 0)

    // 创建独立的渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    this.renderer.setPixelRatio(this.pixelRatio)
    this.renderer.setSize(size, size)
    this.renderer.setClearColor(0x000000, 0) // 透明背景
    this.container.appendChild(this.renderer.domElement)

    // 创建坐标轴组
    this.axesGroup = new THREE.Group()
    this.scene.add(this.axesGroup)

    // 创建三轴
    this.createAxes()

    // 初始渲染
    this.render()
  }

  /**
   * 创建三轴 - X红、Y绿、Z蓝
   * 使用加粗的线条和箭头
   */
  private createAxes(): void {
    const axisLength = 35
    const lineRadius = 1.5
    const headRadius = 4
    const headLength = 10

    // X轴 - 红色 (指向右侧)
    this.createAxis(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(axisLength, 0, 0),
      0xff4444,
      lineRadius,
      headRadius,
      headLength,
      'X'
    )

    // Y轴 - 绿色 (指向上方)
    this.createAxis(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, axisLength, 0),
      0x44ff44,
      lineRadius,
      headRadius,
      headLength,
      'Y'
    )

    // Z轴 - 蓝色 (指向屏幕外/观察者)
    this.createAxis(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, axisLength),
      0x4444ff,
      lineRadius,
      headRadius,
      headLength,
      'Z'
    )

    // 在原点添加一个小球
    const sphereGeometry = new THREE.SphereGeometry(3, 16, 16)
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    this.axesGroup.add(sphere)
  }

  /**
   * 创建单个轴 - 圆柱体线条 + 圆锥体箭头
   */
  private createAxis(
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: number,
    lineRadius: number,
    headRadius: number,
    headLength: number,
    label: string
  ): void {
    const direction = new THREE.Vector3().subVectors(end, start).normalize()
    const length = start.distanceTo(end)

    // 创建圆柱体作为轴线（加粗）
    const lineGeometry = new THREE.CylinderGeometry(lineRadius, lineRadius, length, 12)
    const lineMaterial = new THREE.MeshBasicMaterial({ color })
    const line = new THREE.Mesh(lineGeometry, lineMaterial)

    // 定位圆柱体：中心点在两点的中点，方向指向end
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    line.position.copy(midPoint)

    // 旋转圆柱体使其指向正确方向
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    line.setRotationFromQuaternion(quaternion)

    this.axesGroup.add(line)

    // 创建圆锥体作为箭头
    const coneGeometry = new THREE.ConeGeometry(headRadius, headLength, 12)
    const coneMaterial = new THREE.MeshBasicMaterial({ color })
    const cone = new THREE.Mesh(coneGeometry, coneMaterial)

    // 定位箭头在轴的末端
    cone.position.copy(end)

    // 旋转圆锥使其指向正确方向（圆锥默认指向Y轴正方向）
    const coneQuaternion = new THREE.Quaternion()
    coneQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    cone.setRotationFromQuaternion(coneQuaternion)

    this.axesGroup.add(cone)

    // 添加文字标签
    const labelOffset = 12
    const labelPos = end.clone().add(direction.clone().multiplyScalar(labelOffset))
    const labelSprite = this.createLabel(label, color)
    labelSprite.position.copy(labelPos)
    this.axesGroup.add(labelSprite)
  }

  /**
   * 创建文字标签
   */
  private createLabel(text: string, color: number): THREE.Sprite {
    const canvas = document.createElement('canvas')
    const size = 128
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // 清除画布
    ctx.clearRect(0, 0, size, size)

    // 绘制文字
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
    ctx.font = 'bold 72px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, size / 2, size / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(15, 15, 1)

    return sprite
  }

  /**
   * 渲染
   */
  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * 更新旋转（跟随主场景相机）
   * 使用相机的世界旋转来旋转坐标轴组
   */
  updateRotation(camera: THREE.Camera): void {
    // 获取相机的世界旋转四元数
    const cameraQuaternion = new THREE.Quaternion()
    camera.getWorldQuaternion(cameraQuaternion)

    // 反转相机旋转（因为我们想要显示相机视角下的坐标轴方向）
    const inverseQuaternion = cameraQuaternion.clone().invert()

    // 应用旋转到坐标轴组
    this.axesGroup.setRotationFromQuaternion(inverseQuaternion)

    this.render()
  }

  /**
   * 销毁
   */
  dispose(): void {
    // 清理场景中的所有对象
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      } else if (child instanceof THREE.Sprite) {
        if (child.material) {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      }
    })

    this.renderer.dispose()

    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }
  }
}



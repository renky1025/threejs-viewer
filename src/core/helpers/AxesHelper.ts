/**
 * 三轴辅助器 - 显示模型的坐标轴
 */
import * as THREE from 'three'

/**
 * 创建轴标签精灵
 */
function createAxisLabel(
  text: string,
  color: number,
  position: THREE.Vector3
): THREE.Sprite | null {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 32
  const context = canvas.getContext('2d')
  
  if (!context) return null

  context.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  context.font = 'bold 16px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, 32, 16)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  sprite.position.copy(position)
  sprite.scale.set(0.5, 0.25, 1)
  
  return sprite
}

/**
 * 创建单个轴（线 + 箭头）
 */
function createAxis(
  direction: THREE.Vector3,
  color: number,
  length: number
): THREE.Group {
  const group = new THREE.Group()
  const material = new THREE.LineBasicMaterial({ color })

  // 创建轴线
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    direction.clone().multiplyScalar(length)
  ])
  const line = new THREE.Line(lineGeometry, material)
  group.add(line)

  // 创建箭头
  const arrowGeometry = new THREE.ConeGeometry(length * 0.03, length * 0.05, 8)
  const arrowMaterial = new THREE.MeshBasicMaterial({ color })
  const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial)
  arrow.position.copy(direction.clone().multiplyScalar(length))

  // 旋转箭头使其指向正确方向
  if (direction.x === 1) {
    arrow.rotation.z = -Math.PI / 2
  } else if (direction.y === 1) {
    // Y轴默认方向正确
  } else if (direction.z === 1) {
    arrow.rotation.x = Math.PI / 2
  }

  group.add(arrow)
  return group
}

/**
 * 添加三轴辅助器到场景
 */
export function addAxesHelper(scene: THREE.Scene, object: THREE.Object3D): THREE.Group {
  // 计算模型的包围盒
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  // 根据模型大小调整轴的长度
  const axisLength = Math.max(size.x, size.y, size.z) * 0.8

  // 创建轴组
  const axesGroup = new THREE.Group()

  // X轴 - 红色
  const xAxis = createAxis(new THREE.Vector3(1, 0, 0), 0xff0000, axisLength)
  axesGroup.add(xAxis)

  // Y轴 - 绿色
  const yAxis = createAxis(new THREE.Vector3(0, 1, 0), 0x00ff00, axisLength)
  axesGroup.add(yAxis)

  // Z轴 - 蓝色
  const zAxis = createAxis(new THREE.Vector3(0, 0, 1), 0x0000ff, axisLength)
  axesGroup.add(zAxis)

  // 添加轴标签
  const xLabel = createAxisLabel('X', 0xff0000, new THREE.Vector3(axisLength * 1.2, 0, 0))
  const yLabel = createAxisLabel('Y', 0x00ff00, new THREE.Vector3(0, axisLength * 1.2, 0))
  const zLabel = createAxisLabel('Z', 0x0000ff, new THREE.Vector3(0, 0, axisLength * 1.2))

  if (xLabel) axesGroup.add(xLabel)
  if (yLabel) axesGroup.add(yLabel)
  if (zLabel) axesGroup.add(zLabel)

  // 将轴放置在模型中心
  axesGroup.position.copy(center)

  // 添加到场景
  scene.add(axesGroup)

  // 保存引用以便后续清理
  if (!scene.userData.axesHelper) {
    scene.userData.axesHelper = []
  }
  scene.userData.axesHelper.push(axesGroup)

  return axesGroup
}

/**
 * 清理三轴辅助器
 */
export function removeAxesHelper(scene: THREE.Scene): void {
  if (!scene.userData.axesHelper) return

  scene.userData.axesHelper.forEach((axes: THREE.Group) => {
    scene.remove(axes)
    
    // 遍历 Group 中的所有子对象进行清理
    axes.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      } else if (child instanceof THREE.Line) {
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
  })

  scene.userData.axesHelper = []
}

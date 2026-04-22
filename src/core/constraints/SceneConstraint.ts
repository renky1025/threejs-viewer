import * as THREE from 'three'

export interface SceneConstraintOptions {
  groundY?: number
  halfSize?: number
  padding?: number
  maxHeight?: number
  maxLift?: number
}

const DEFAULT_OPTIONS: Required<SceneConstraintOptions> = {
  groundY: 0,
  halfSize: 50,
  padding: 0.5,
  maxHeight: 30,
  maxLift: 25
}

const box = new THREE.Box3()
const center = new THREE.Vector3()
const size = new THREE.Vector3()
const offset = new THREE.Vector3()

function clampCenter(centerValue: number, halfExtent: number, maxHalfSize: number): number {
  const availableHalf = Math.max(maxHalfSize - halfExtent, 0)
  return THREE.MathUtils.clamp(centerValue, -availableHalf, availableHalf)
}

/**
 * 创建场景约束函数：
 * 1. 模型底部始终贴合地面
 * 2. 模型始终限制在地面边界内
 */
export function createSceneConstraint(options: SceneConstraintOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const maxHalfSize = Math.max(opts.halfSize - opts.padding, 0.1)
  const maxSpan = maxHalfSize * 2

  return (target: THREE.Object3D): void => {
    box.setFromObject(target)
    if (box.isEmpty()) return
    box.getSize(size)

    // 约束尺寸：如果模型超过可视场地，按比例缩小
    const scaleX = size.x > 0 ? maxSpan / size.x : 1
    const scaleZ = size.z > 0 ? maxSpan / size.z : 1
    const scaleY = size.y > 0 ? opts.maxHeight / size.y : 1
    const fitScale = Math.min(scaleX, scaleY, scaleZ)

    if (fitScale < 1) {
      target.scale.multiplyScalar(fitScale)
      box.setFromObject(target)
      if (box.isEmpty()) return
    }

    // 约束 Y：允许上移，但不允许穿过地面，也不允许无限上移
    const minY = opts.groundY
    const maxY = opts.groundY + opts.maxLift
    let deltaY = 0
    if (box.min.y < minY) {
      deltaY = minY - box.min.y
    } else if (box.min.y > maxY) {
      deltaY = maxY - box.min.y
    }

    if (Math.abs(deltaY) > 1e-6) {
      target.position.y += deltaY
      offset.set(0, deltaY, 0)
      box.translate(offset)
    }

    // 约束 X/Z：中心点限制在可用边界内
    box.getCenter(center)
    box.getSize(size)

    const targetCenterX = clampCenter(center.x, size.x / 2, maxHalfSize)
    const targetCenterZ = clampCenter(center.z, size.z / 2, maxHalfSize)

    const deltaX = targetCenterX - center.x
    const deltaZ = targetCenterZ - center.z

    if (Math.abs(deltaX) > 1e-6 || Math.abs(deltaZ) > 1e-6) {
      target.position.x += deltaX
      target.position.z += deltaZ
    }
  }
}

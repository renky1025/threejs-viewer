import * as THREE from 'three'

interface ExplodedItem {
  object: THREE.Object3D
  originLocal: THREE.Vector3
  directionWorld: THREE.Vector3
  distance: number
}

interface ExplodedViewOptions {
  groundY?: number
  halfSize?: number
  padding?: number
  maxHeight?: number
  liftPhase?: number
  liftRatio?: number
  minLift?: number
  maxLift?: number
  explodeRatio?: number
}

const DEFAULT_OPTIONS: Required<ExplodedViewOptions> = {
  groundY: 0,
  halfSize: 50,
  padding: 0.5,
  maxHeight: 30,
  liftPhase: 0.28,
  liftRatio: 0.22,
  minLift: 0.6,
  maxLift: 6,
  explodeRatio: 0.95
}

export class ExplodedViewController {
  private group: THREE.Object3D
  private items: ExplodedItem[] = []
  private liftHeight = 1
  private options: Required<ExplodedViewOptions>
  private worldBox = new THREE.Box3()
  private tmpVecA = new THREE.Vector3()
  private tmpVecB = new THREE.Vector3()
  private tmpMat4 = new THREE.Matrix4()
  private tmpMat3 = new THREE.Matrix3()
  private worldUp = new THREE.Vector3(0, 1, 0)

  constructor(group: THREE.Object3D, options: ExplodedViewOptions = {}) {
    this.group = group
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.compute()
  }

  private computeDirectionForItem(
    meshBox: THREE.Box3,
    centerWorld: THREE.Vector3,
    sceneBox: THREE.Box3,
    index: number,
    count: number
  ): THREE.Vector3 {
    const meshCenter = meshBox.getCenter(new THREE.Vector3())

    // 水平方向：永远从中心向外扩散
    const horizontal = meshCenter.clone().sub(centerWorld)
    horizontal.y = 0
    if (horizontal.lengthSq() <= 1e-10) {
      const angle = (index / Math.max(count, 1)) * Math.PI * 2
      horizontal.set(Math.cos(angle), 0, Math.sin(angle))
    } else {
      horizontal.normalize()
    }

    // 垂直方向：上层部件向上、下层部件向下
    const sceneHeight = Math.max(sceneBox.max.y - sceneBox.min.y, 1e-6)
    const halfHeight = sceneHeight * 0.5
    let vertical = THREE.MathUtils.clamp((meshCenter.y - centerWorld.y) / halfHeight, -1, 1)

    // 中层部件按是否贴近顶部/底部做偏置，避免腿/靠背方向翻转
    if (Math.abs(vertical) < 0.12) {
      const bottomDistanceRatio = (meshBox.min.y - sceneBox.min.y) / sceneHeight
      const topDistanceRatio = (sceneBox.max.y - meshBox.max.y) / sceneHeight
      const nearBottom = bottomDistanceRatio < 0.22
      const nearTop = topDistanceRatio < 0.22

      if (nearBottom && !nearTop) {
        vertical = -0.3
      } else if (nearTop && !nearBottom) {
        vertical = 0.3
      }
    }

    const direction = new THREE.Vector3().copy(horizontal).multiplyScalar(0.82)
    direction.y = vertical * 0.9
    if (direction.lengthSq() <= 1e-10) {
      direction.copy(this.worldUp)
    }
    return direction.normalize()
  }

  private applyWorldDelta(object: THREE.Object3D, deltaWorld: THREE.Vector3): void {
    if (deltaWorld.lengthSq() <= 1e-10) return

    const parent = object.parent
    if (!parent) {
      object.position.add(deltaWorld)
      return
    }

    parent.updateWorldMatrix(true, false)
    this.tmpMat4.copy(parent.matrixWorld).invert()
    this.tmpMat3.setFromMatrix4(this.tmpMat4)

    this.tmpVecA.copy(deltaWorld).applyMatrix3(this.tmpMat3)
    object.position.add(this.tmpVecA)
  }

  private computeMaxDistanceInBounds(box: THREE.Box3, directionWorld: THREE.Vector3): number {
    const minBound = -this.options.halfSize + this.options.padding
    const maxBound = this.options.halfSize - this.options.padding
    const maxY = this.options.groundY + this.options.maxHeight
    const epsilon = 1e-6
    let maxDistance = Number.POSITIVE_INFINITY

    const updateAxisLimit = (
      minValue: number,
      maxValue: number,
      dirValue: number,
      rangeMin: number,
      rangeMax: number
    ) => {
      if (dirValue > epsilon) {
        maxDistance = Math.min(maxDistance, (rangeMax - maxValue) / dirValue)
      } else if (dirValue < -epsilon) {
        maxDistance = Math.min(maxDistance, (rangeMin - minValue) / dirValue)
      }
    }

    updateAxisLimit(box.min.x, box.max.x, directionWorld.x, minBound, maxBound)
    updateAxisLimit(box.min.y, box.max.y, directionWorld.y, this.options.groundY, maxY)
    updateAxisLimit(box.min.z, box.max.z, directionWorld.z, minBound, maxBound)

    if (!Number.isFinite(maxDistance)) return Number.POSITIVE_INFINITY
    return Math.max(0, maxDistance)
  }

  private compute() {
    this.items = []
    this.group.updateWorldMatrix(true, true)

    const bbox = new THREE.Box3().setFromObject(this.group)
    const centerWorld = bbox.getCenter(new THREE.Vector3())
    const size = bbox.getSize(new THREE.Vector3())
    const requestedDistance = Math.max(size.length() * this.options.explodeRatio, 1)
    this.liftHeight = THREE.MathUtils.clamp(size.y * this.options.liftRatio, this.options.minLift, this.options.maxLift)
    this.liftHeight = Math.min(this.liftHeight, Math.max(0, this.options.groundY + this.options.maxHeight - bbox.max.y))

    const tempItems: Array<{ mesh: THREE.Object3D; originLocal: THREE.Vector3; meshBox: THREE.Box3 }> = []

    this.group.traverse((obj) => {
      if (obj === this.group) return
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return

      this.worldBox.setFromObject(mesh)
      if (this.worldBox.isEmpty()) return

      const originLocal = mesh.position.clone()
      tempItems.push({ mesh, originLocal, meshBox: this.worldBox.clone() })
    })

    const total = tempItems.length
    tempItems.forEach((entry, index) => {
      const directionWorld = this.computeDirectionForItem(entry.meshBox, centerWorld, bbox, index, total)

      const liftedBox = entry.meshBox.clone()
      liftedBox.translate(this.worldUp.clone().multiplyScalar(this.liftHeight))
      const allowedDistance = this.computeMaxDistanceInBounds(liftedBox, directionWorld)
      const distance = Math.min(requestedDistance, allowedDistance)

      this.items.push({
        object: entry.mesh,
        originLocal: entry.originLocal,
        directionWorld,
        distance
      })
    })
  }

  setFactor(t: number) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1)
    this.group.updateWorldMatrix(true, true)

    const liftPhase = THREE.MathUtils.clamp(this.options.liftPhase, 0.05, 0.95)
    const liftProgress = Math.min(clamped / liftPhase, 1)
    const explodeProgress = clamped <= liftPhase ? 0 : (clamped - liftPhase) / (1 - liftPhase)

    this.items.forEach((item) => {
      this.tmpVecA.copy(item.directionWorld).multiplyScalar(item.distance * explodeProgress)
      this.tmpVecB.copy(this.worldUp).multiplyScalar(this.liftHeight * liftProgress).add(this.tmpVecA)

      item.object.position.copy(item.originLocal)
      this.applyWorldDelta(item.object, this.tmpVecB)
    })
  }

  reset() {
    this.setFactor(0)
  }

  dispose() {
    this.reset()
    this.items = []
  }
}

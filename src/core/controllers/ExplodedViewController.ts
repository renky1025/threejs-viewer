import * as THREE from 'three'

interface ExplodedItem {
  object: THREE.Object3D
  origin: THREE.Vector3
  direction: THREE.Vector3
  distance: number
}

export class ExplodedViewController {
  private group: THREE.Object3D
  private items: ExplodedItem[] = []
  private factor = 0

  constructor(group: THREE.Object3D) {
    this.group = group
    this.compute()
  }

  private compute() {
    this.items = []

    const bbox = new THREE.Box3().setFromObject(this.group)
    const center = bbox.getCenter(new THREE.Vector3())
    const size = bbox.getSize(new THREE.Vector3())
    const maxDistance = size.length() || 1

    this.group.traverse((obj) => {
      if (obj === this.group) return
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return

      const box = new THREE.Box3().setFromObject(mesh)
      const c = box.getCenter(new THREE.Vector3())
      const dir = c.clone().sub(center)
      if (dir.lengthSq() === 0) return
      dir.normalize()

      const origin = mesh.position.clone()
      const distance = maxDistance * 0.5

      this.items.push({
        object: mesh,
        origin,
        direction: dir,
        distance
      })
    })
  }

  setFactor(t: number) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1)
    this.factor = clamped

    this.items.forEach((item) => {
      const offset = item.direction.clone().multiplyScalar(item.distance * this.factor)
      item.object.position.copy(item.origin).add(offset)
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

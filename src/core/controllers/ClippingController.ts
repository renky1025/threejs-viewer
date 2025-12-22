import * as THREE from 'three'

export type ClippingAxis = 'x' | 'y' | 'z'

export class ClippingController {
  private renderer: THREE.WebGLRenderer
  private target: THREE.Object3D
  private bbox: THREE.Box3
  private planes: Map<ClippingAxis, THREE.Plane>
  private enabledAxes: Set<ClippingAxis>

  constructor(renderer: THREE.WebGLRenderer, target: THREE.Object3D) {
    this.renderer = renderer
    this.target = target
    this.bbox = new THREE.Box3().setFromObject(target)
    this.planes = new Map()
    this.enabledAxes = new Set()

    this.renderer.localClippingEnabled = true
  }

  private getPlane(axis: ClippingAxis): THREE.Plane {
    let plane = this.planes.get(axis)
    if (!plane) {
      plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
      this.planes.set(axis, plane)
    }
    return plane
  }

  private updateRendererPlanes() {
    const list: THREE.Plane[] = []
    this.enabledAxes.forEach((axis) => {
      const plane = this.planes.get(axis)
      if (plane) {
        list.push(plane)
      }
    })
    this.renderer.clippingPlanes = list
  }

  setAxisPlane(axis: ClippingAxis, t: number) {
    const clamped = Math.min(1, Math.max(0, t))
    this.bbox.setFromObject(this.target)

    const min = this.bbox.min
    const max = this.bbox.max

    let value = 0
    if (axis === 'x') {
      value = min.x + (max.x - min.x) * clamped
    } else if (axis === 'y') {
      value = min.y + (max.y - min.y) * clamped
    } else {
      value = min.z + (max.z - min.z) * clamped
    }

    const plane = this.getPlane(axis)
    if (axis === 'x') {
      plane.normal.set(1, 0, 0)
    } else if (axis === 'y') {
      plane.normal.set(0, 1, 0)
    } else {
      plane.normal.set(0, 0, 1)
    }
    plane.constant = -value

    this.enabledAxes.add(axis)
    this.updateRendererPlanes()
  }

  toggleAxis(axis: ClippingAxis, enabled: boolean) {
    if (enabled) {
      this.enabledAxes.add(axis)
    } else {
      this.enabledAxes.delete(axis)
    }
    this.updateRendererPlanes()
  }

  reset() {
    this.enabledAxes.clear()
    this.renderer.clippingPlanes = []
  }

  dispose() {
    this.reset()
  }
}

import * as THREE from 'three'
import { enableMeshBVH } from '../pipeline/MeshPipeline'

export class MeasureController {
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLDivElement
  private target: THREE.Object3D
  private raycaster: THREE.Raycaster
  private enabled = false
  private clickHandler: (event: MouseEvent) => void
  private points: THREE.Vector3[] = []
  private distance: number | null = null
  private helperGroup: THREE.Group
  private pointMeshes: THREE.Mesh[] = []
  private line: THREE.Line | null = null
  private normalArrows: THREE.ArrowHelper[] = []
  private normalLength = 1

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLDivElement, target: THREE.Object3D) {
    this.camera = camera
    this.domElement = domElement
    this.target = target
    this.raycaster = new THREE.Raycaster()

    ;(this.raycaster as any).firstHitOnly = true

    this.clickHandler = this.onClick.bind(this)

    this.helperGroup = new THREE.Group()
    this.target.add(this.helperGroup)

    this.updateBounds()

    enableMeshBVH()
    this.buildBVH()
  }

  private buildBVH() {
    this.target.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const geometry = mesh.geometry as THREE.BufferGeometry
      const anyGeom = geometry as any
      if (typeof anyGeom.computeBoundsTree === 'function' && !anyGeom.boundsTree) {
        anyGeom.computeBoundsTree()
      }
    })
  }

  private updateBounds() {
    const box = new THREE.Box3().setFromObject(this.target)
    const size = box.getSize(new THREE.Vector3())
    const diag = size.length() || 1
    this.normalLength = diag * 0.05
  }

  pick(clientX: number, clientY: number): { point: THREE.Vector3; normal: THREE.Vector3 | null } | null {
    const rect = this.domElement.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      return null
    }

    const x = ((clientX - rect.left) / rect.width) * 2 - 1
    const y = -((clientY - rect.top) / rect.height) * 2 + 1

    const ndc = new THREE.Vector2(x, y)
    this.raycaster.setFromCamera(ndc, this.camera)

    const intersects = this.raycaster.intersectObject(this.target, true)
    const hit = intersects[0]
    if (!hit) {
      return null
    }

    let normal: THREE.Vector3 | null = null
    if (hit.face) {
      normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    }

    return {
      point: hit.point.clone(),
      normal
    }
  }

  private onClick(event: MouseEvent) {
    if (!this.enabled) return
    const result = this.pick(event.clientX, event.clientY)
    if (!result) return

    this.points.push(result.point)
    if (this.points.length > 2) {
      this.points.shift()
    }

    if (this.points.length === 2) {
      const p1 = this.points[0]
      const p2 = this.points[1]
      if (p1 && p2) {
        this.distance = p1.distanceTo(p2)
      } else {
        this.distance = null
      }
    } else {
      this.distance = null
    }

    this.updateHelpers(result.normal)
  }

  private clearHelpers() {
    this.pointMeshes.forEach((m) => {
      this.helperGroup.remove(m)
      m.geometry.dispose()
      if (Array.isArray(m.material)) {
        m.material.forEach((mat) => mat.dispose())
      } else {
        m.material.dispose()
      }
    })
    this.pointMeshes = []

    if (this.line) {
      this.helperGroup.remove(this.line)
      this.line.geometry.dispose()
      ;(this.line.material as THREE.Material).dispose()
      this.line = null
    }

    this.normalArrows.forEach((a) => {
      this.helperGroup.remove(a)
      a.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (!mesh.isMesh) return
        const geom = mesh.geometry as THREE.BufferGeometry
        const mat = mesh.material
        geom.dispose()
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose())
        } else {
          mat.dispose()
        }
      })
    })
    this.normalArrows = []
  }

  private updateHelpers(lastNormal: THREE.Vector3 | null) {
    this.clearHelpers()

    // 点
    const sphereGeom = new THREE.SphereGeometry(this.normalLength * 0.1, 12, 12)
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 })

    this.points.forEach((p) => {
      const mesh = new THREE.Mesh(sphereGeom.clone(), sphereMat.clone())
      mesh.position.copy(p)
      this.helperGroup.add(mesh)
      this.pointMeshes.push(mesh)
    })

    // 点到点连线
    if (this.points.length === 2) {
      const geom = new THREE.BufferGeometry().setFromPoints(this.points)
      const mat = new THREE.LineBasicMaterial({ color: 0xff0000 })
      this.line = new THREE.Line(geom, mat)
      this.helperGroup.add(this.line)
    }

    // 法线箭头（只画最近一次点击点的法线）
    if (lastNormal && this.points.length > 0) {
      const origin = this.points[this.points.length - 1]
      const arrow = new THREE.ArrowHelper(lastNormal.clone().normalize(), origin, this.normalLength, 0x00ffff)
      this.helperGroup.add(arrow)
      this.normalArrows.push(arrow)
    }
  }

  enable() {
    if (this.enabled) return
    this.enabled = true
    this.domElement.addEventListener('click', this.clickHandler)
  }

  disable() {
    if (!this.enabled) return
    this.enabled = false
    this.domElement.removeEventListener('click', this.clickHandler)
  }

  clear() {
    this.points = []
    this.distance = null
    this.clearHelpers()
  }

  getResult() {
    return {
      points: this.points.map((p) => p.toArray() as [number, number, number]),
      distance: this.distance
    }
  }

  dispose() {
    this.disable()
    this.clearHelpers()
    this.target.remove(this.helperGroup)
    this.target.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const geometry = mesh.geometry as THREE.BufferGeometry
      const anyGeom = geometry as any
      if (typeof anyGeom.disposeBoundsTree === 'function') {
        anyGeom.disposeBoundsTree()
      }
    })
  }
}

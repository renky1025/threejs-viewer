import * as THREE from 'three'

export interface MaterialEditOptions {
  metalness?: number
  roughness?: number
}

export interface MaterialProperties {
  metalness: number | null
  roughness: number | null
}

export class MaterialEditorController {
  private root: THREE.Object3D
  private meshMap: Map<string, THREE.Mesh> = new Map()

  constructor(root: THREE.Object3D) {
    this.root = root
    this.buildMeshMap()
  }

  private buildMeshMap() {
    this.meshMap.clear()
    this.root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      this.meshMap.set(mesh.uuid, mesh)
    })
  }

  private forEachStandardMaterial(mesh: THREE.Mesh, cb: (mat: THREE.MeshStandardMaterial) => void) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

    const newMaterials = materials.map((mat) => {
      if (!mat) return mat

      // 确保每个网格拥有自己独立的材质实例
      const anyMat = mat as any
      let targetMat = mat
      if (!anyMat.userData) {
        anyMat.userData = {}
      }
      if (!anyMat.userData.__ftmiMatEditCloned) {
        targetMat = mat.clone()
        anyMat.userData.__ftmiMatEditCloned = true
      }

      const stdMat = targetMat as THREE.MeshStandardMaterial
      if (!stdMat.isMeshStandardMaterial) {
        return targetMat
      }

      cb(stdMat)
      return targetMat
    })

    if (Array.isArray(mesh.material)) {
      mesh.material = newMaterials as THREE.Material[]
    } else if (newMaterials[0]) {
      mesh.material = newMaterials[0] as THREE.Material
    }
  }

  setProperties(uuid: string, options: MaterialEditOptions): void {
    const mesh = this.meshMap.get(uuid)
    if (!mesh) return

    this.forEachStandardMaterial(mesh, (mat) => {
      if (typeof options.metalness === 'number') {
        mat.metalness = THREE.MathUtils.clamp(options.metalness, 0, 1)
      }
      if (typeof options.roughness === 'number') {
        mat.roughness = THREE.MathUtils.clamp(options.roughness, 0, 1)
      }
    })
  }

  getProperties(uuid: string): MaterialProperties | null {
    const mesh = this.meshMap.get(uuid)
    if (!mesh) return null

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    let metalness: number | null = null
    let roughness: number | null = null

    for (const mat of materials) {
      if (!mat) continue
      const stdMat = mat as THREE.MeshStandardMaterial
      if (!stdMat.isMeshStandardMaterial) continue

      metalness = stdMat.metalness
      roughness = stdMat.roughness
      break
    }

    return { metalness, roughness }
  }

  dispose() {
    this.meshMap.clear()
  }
}

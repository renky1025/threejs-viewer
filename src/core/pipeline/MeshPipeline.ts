import * as THREE from 'three'
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh'

let bvhPatched = false

export function enableMeshBVH(): void {
  if (bvhPatched) return
  bvhPatched = true

  const geomProto = THREE.BufferGeometry.prototype as any
  if (!geomProto.computeBoundsTree) {
    geomProto.computeBoundsTree = computeBoundsTree
  }
  if (!geomProto.disposeBoundsTree) {
    geomProto.disposeBoundsTree = disposeBoundsTree
  }

  const meshProto = THREE.Mesh.prototype as any
  if (meshProto.raycast !== acceleratedRaycast) {
    meshProto.raycast = acceleratedRaycast
  }
}

export function normalizeMesh(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) {
      return
    }

    const geometry = mesh.geometry as THREE.BufferGeometry
    if (geometry && !geometry.attributes.normal) {
      geometry.computeVertexNormals()
    }

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((mat) => {
      if (!mat) return
      mat.side = THREE.DoubleSide
    })
  })
}

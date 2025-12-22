declare module 'three-mesh-bvh' {
  import type { BufferGeometry, Mesh, Raycaster } from 'three'

  export function computeBoundsTree(this: BufferGeometry): void
  export function disposeBoundsTree(this: BufferGeometry): void
  export function acceleratedRaycast(this: Mesh, raycaster: Raycaster, intersects: any[]): void
}

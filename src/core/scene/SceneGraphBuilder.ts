import * as THREE from 'three'
import type { SceneNode } from '../types'

export class SceneGraphBuilder {
  static build(root: THREE.Object3D): SceneNode[] {
    return root.children.map((child) => this.buildNode(child))
  }

  private static buildNode(obj: THREE.Object3D): SceneNode {
    const name = obj.name || obj.type || 'Object'

    const children = obj.children.map((child) => this.buildNode(child))

    return {
      id: obj.uuid,
      name,
      type: obj.type,
      visible: obj.visible,
      opacity: null,
      locked: !!(obj as any).userData?.locked,
      children
    }
  }
}

import * as THREE from 'three'
import type { ModelType } from '../types'

interface OcctModule {
  ReadStepFile: (content: Uint8Array, params: any) => any
  ReadIgesFile: (content: Uint8Array, params: any) => any
}

let occtPromise: Promise<OcctModule> | null = null

async function getOcctModule(): Promise<OcctModule> {
  if (!occtPromise) {
    const occtimportjs = (await import('occt-import-js')).default as () => Promise<OcctModule>
    occtPromise = occtimportjs()
  }
  return occtPromise
}

function buildGeometryFromMesh(meshData: any): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()

  const positionArray = meshData?.attributes?.position?.array as number[] | undefined
  if (!positionArray || positionArray.length === 0) {
    return geometry
  }

  const positionAttr = new THREE.Float32BufferAttribute(positionArray, 3)
  geometry.setAttribute('position', positionAttr)

  const normalArray = meshData?.attributes?.normal?.array as number[] | undefined
  if (normalArray && normalArray.length > 0) {
    const normalAttr = new THREE.Float32BufferAttribute(normalArray, 3)
    geometry.setAttribute('normal', normalAttr)
  }

  const indexArray = meshData?.index?.array as number[] | undefined
  if (indexArray && indexArray.length > 0) {
    geometry.setIndex(indexArray)
  }

  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  return geometry
}

function buildMeshes(result: any): THREE.Mesh[] {
  const srcMeshes = Array.isArray(result?.meshes) ? result.meshes : []
  const meshes: THREE.Mesh[] = []

  for (let i = 0; i < srcMeshes.length; i++) {
    const m = srcMeshes[i]
    const geometry = buildGeometryFromMesh(m)

    const colorArray = m?.color as number[] | undefined
    let color: THREE.Color
    if (Array.isArray(colorArray) && colorArray.length >= 3) {
      let [r, g, b] = colorArray as [number, number, number]
      // occt-import-js 示例中颜色是 0-1 浮点，如果传入 0-255 就做一次归一化
      if (r > 1 || g > 1 || b > 1) {
        r /= 255
        g /= 255
        b /= 255
      }
      color = new THREE.Color(r, g, b)
    } else {
      color = new THREE.Color(0xd5d5d5)
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.0,
      roughness: 0.6,
      side: THREE.DoubleSide
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = m?.name || ''
    mesh.castShadow = true
    mesh.receiveShadow = true

    meshes.push(mesh)
  }

  return meshes
}

function buildHierarchy(nodeData: any, meshes: THREE.Mesh[]): THREE.Object3D {
  const group = new THREE.Group()
  group.name = nodeData?.name || ''

  const meshIndices = Array.isArray(nodeData?.meshes) ? nodeData.meshes as number[] : []
  meshIndices.forEach((index) => {
    const mesh = meshes[index]
    if (mesh) {
      group.add(mesh.clone())
    }
  })

  const children = Array.isArray(nodeData?.children) ? nodeData.children : []
  children.forEach((child: any) => {
    const childGroup = buildHierarchy(child, meshes)
    group.add(childGroup)
  })

  return group
}

export class StepIgesLoader {
  async load(file: string, type: ModelType, callbacks: { loading: (p: number) => void }): Promise<THREE.Object3D> {
    callbacks.loading(20)

    const response = await fetch(file)
    if (!response.ok) {
      throw new Error(`STEP/IGES 文件请求失败: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const content = new Uint8Array(arrayBuffer)

    callbacks.loading(40)

    const occt = await getOcctModule()

    let result: any
    if (type === 'step') {
      result = occt.ReadStepFile(content, null)
    } else if (type === 'iges') {
      result = occt.ReadIgesFile(content, null)
    } else {
      throw new Error(`无效的 STEP/IGES 类型: ${type}`)
    }

    if (!result || result.success !== true) {
      throw new Error('STEP/IGES 文件解析失败')
    }

    callbacks.loading(60)

    const meshes = buildMeshes(result)
    const root = buildHierarchy(result.root, meshes)

    // OCCT 默认使用 Z 轴为上，Three.js 默认是 Y 轴为上，这里将 Z-up 转为 Y-up
    root.rotation.x = -Math.PI / 2

    callbacks.loading(70)

    return root
  }
}

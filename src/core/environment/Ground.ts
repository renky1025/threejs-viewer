/**
 * 地面创建模块
 */
import * as THREE from 'three'
import type { GroundType } from '../types'

/**
 * 地面配置选项
 */
export interface GroundOptions {
  /** 地面大小 */
  size?: number
  /** 网格分割数 */
  divisions?: number
  /** 是否显示网格 */
  showGrid?: boolean
  /** 纹理重复次数 */
  textureRepeat?: number
  /** 网格线颜色 */
  gridColor?: number
  /** 网格中心线颜色 */
  gridCenterColor?: number
}

/**
 * 默认地面配置
 */
const DEFAULT_GROUND_OPTIONS: Required<GroundOptions> = {
  size: 100,
  divisions: 20,
  showGrid: true,
  textureRepeat: 10,
  gridColor: 0xcccccc,
  gridCenterColor: 0xcccccc
}

/**
 * 创建地面
 */
export function createGround(
  scene: THREE.Scene,
  type: GroundType,
  options: GroundOptions = {}
): THREE.Group {
  const opts = { ...DEFAULT_GROUND_OPTIONS, ...options }
  const groundGroup = new THREE.Group()

  switch (type) {
    case 'floor':
      createTexturedGround(groundGroup, opts, 'floor')
      break
    case 'grass':
      createTexturedGround(groundGroup, opts, 'grass')
      break
    case 'material':
      // 材质球场景风格 - 深色地面 + 网格
      createMaterialStyleGround(groundGroup, opts)
      break
    default:
      // 默认使用简洁网格地面（如图所示的样式）
      createMinimalGridGround(groundGroup, opts)
      break
  }

  // 将整个组添加到场景
  scene.add(groundGroup)

  return groundGroup
}

/**
 * 创建简洁网格地面（参考图片样式 - 浅灰白色地面 + 浅灰网格线）
 */
function createMinimalGridGround(group: THREE.Group, opts: Required<GroundOptions>): void {
  // 创建浅灰白色地面（接近白色）
  const geometry = new THREE.PlaneGeometry(opts.size, opts.size)
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, // 非常浅的灰白色
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide
  })
  
  const groundMesh = new THREE.Mesh(geometry, material)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.position.y = -0.01
  groundMesh.receiveShadow = true
  group.add(groundMesh)

  // 创建网格线（深灰色，清晰可见）
  if (opts.showGrid) {
    const gridHelper = new THREE.GridHelper(
      opts.size,
      opts.divisions,
      0x888888, // 深灰色网格线
      0x888888  // 深灰色网格线
    )
    gridHelper.position.y = 0
    // 网格线不透明，清晰可见
    const gridMaterial = gridHelper.material as THREE.Material
    if (Array.isArray(gridMaterial)) {
      gridMaterial.forEach(m => {
        m.transparent = false
        m.opacity = 1.0
      })
    } else {
      gridMaterial.transparent = false
      gridMaterial.opacity = 1.0
    }
    group.add(gridHelper)
  }
}

/**
 * 创建材质球风格的地面（明亮地面 + 灰色网格）
 */
function createMaterialStyleGround(group: THREE.Group, opts: Required<GroundOptions>): void {
  // 浅灰白色地面 - 与明亮场景一致
  const geometry = new THREE.PlaneGeometry(opts.size, opts.size)
  const material = new THREE.MeshStandardMaterial({
    color: 0xe8eaed,
    roughness: 0.9,
    metalness: 0.1
  })

  const groundMesh = new THREE.Mesh(geometry, material)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.receiveShadow = true
  group.add(groundMesh)

  // 网格辅助线 - 深灰色
  if (opts.showGrid) {
    const gridHelper = new THREE.GridHelper(
      opts.size,
      opts.divisions,
      0x8899aa,
      0xcdd1d6
    )
    gridHelper.position.y = 0.01
    group.add(gridHelper)
  }
}
function createTexturedGround(group: THREE.Group, opts: Required<GroundOptions>, type: 'floor' | 'grass'): void {
  const geometry = new THREE.PlaneGeometry(opts.size, opts.size)
  const material = type === 'floor' 
    ? createFloorMaterial(opts.textureRepeat)
    : createGrassMaterial(opts.textureRepeat)

  const groundMesh = new THREE.Mesh(geometry, material)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.receiveShadow = true
  group.add(groundMesh)

  // 添加网格辅助线
  if (opts.showGrid) {
    const gridHelper = new THREE.GridHelper(
      opts.size,
      opts.divisions,
      opts.gridCenterColor,
      opts.gridColor
    )
    gridHelper.position.y = 0.01
    const gridMaterial = gridHelper.material as THREE.Material
    if (Array.isArray(gridMaterial)) {
      gridMaterial.forEach(m => {
        m.transparent = true
        m.opacity = 0.3
      })
    } else {
      gridMaterial.transparent = true
      gridMaterial.opacity = 0.3
    }
    group.add(gridHelper)
  }
}

/**
 * 创建木地板材质
 */
function createFloorMaterial(repeat: number): THREE.MeshStandardMaterial {
  const textureLoader = new THREE.TextureLoader()
  
  const floorTexture = textureLoader.load('/assets/wood.jpg')
  floorTexture.wrapS = THREE.RepeatWrapping
  floorTexture.wrapT = THREE.RepeatWrapping
  floorTexture.repeat.set(repeat, repeat)

  const normalMap = textureLoader.load('/assets/wood_floor_normal.jpg')
  normalMap.wrapS = THREE.RepeatWrapping
  normalMap.wrapT = THREE.RepeatWrapping
  normalMap.repeat.set(repeat, repeat)

  return new THREE.MeshStandardMaterial({
    map: floorTexture,
    normalMap: normalMap,
    roughness: 0.8,
    metalness: 0.2
  })
}

/**
 * 创建草地材质
 */
function createGrassMaterial(repeat: number): THREE.MeshStandardMaterial {
  const textureLoader = new THREE.TextureLoader()
  
  const grassTexture = textureLoader.load('/assets/grass.jpg')
  grassTexture.wrapS = THREE.RepeatWrapping
  grassTexture.wrapT = THREE.RepeatWrapping
  grassTexture.repeat.set(repeat, repeat)

  return new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 1.0
  })
}


/**
 * 清理地面资源
 */
export function disposeGround(ground: THREE.Group): void {
  ground.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        const material = child.material as THREE.MeshStandardMaterial
        if (material.map) material.map.dispose()
        if (material.normalMap) material.normalMap.dispose()
        material.dispose()
      }
    }
  })
}

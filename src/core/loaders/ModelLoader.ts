/**
 * 模型加载器 - 支持多种 3D 模型格式
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import type { Model, ModelLoadCallbacks, ModelLoadResult } from '../types'
import { normalizeMesh } from '../pipeline/MeshPipeline'
import { StepIgesLoader } from './StepIgesLoader'

/**
 * 模型加载器类
 */
export class ModelLoader {
  private gltfLoader: GLTFLoader
  private fbxLoader: FBXLoader
  private objLoader: OBJLoader
  private mtlLoader: MTLLoader
  private stlLoader: STLLoader
  private textureLoader: THREE.TextureLoader
  private stepIgesLoader: StepIgesLoader

  constructor() {
    this.gltfLoader = new GLTFLoader()
    this.fbxLoader = new FBXLoader()
    this.objLoader = new OBJLoader()
    this.mtlLoader = new MTLLoader()
    this.stlLoader = new STLLoader()
    this.textureLoader = new THREE.TextureLoader()
    this.stepIgesLoader = new StepIgesLoader()
  }

  /**
   * 加载模型
   */
  async load(model: Model, callbacks: ModelLoadCallbacks): Promise<ModelLoadResult> {
    callbacks.loading(10)

    try {
      let result: ModelLoadResult

      switch (model.type) {
        case 'gltf':
        case 'glb':
          result = await this.loadGLTF(model.file, callbacks)
          break
        case 'fbx':
          result = await this.loadFBX(model.file, callbacks)
          break
        case 'obj':
          result = await this.loadOBJ(model.file, callbacks)
          break
        case 'stl':
          result = await this.loadSTL(model.file, callbacks)
          break
        case 'step':
        case 'iges':
          result = await this.loadStepIges(model.file, model.type, callbacks)
          break
        case 'json':
          throw new Error('JSON文件类型应使用专门的压力数据查看器')
        default:
          throw new Error(`不支持的模型类型: ${model.type}`)
      }

      return result
    } catch (error) {
      callbacks.error(error)
      throw error
    }
  }

  /**
   * 加载 GLTF/GLB 模型
   */
  private async loadGLTF(file: string, callbacks: ModelLoadCallbacks): Promise<ModelLoadResult> {
    const gltf = await this.gltfLoader.loadAsync(file, (xhr) => {
      if (xhr.lengthComputable) {
        const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
        callbacks.loading(progress)
      }
    })

    let mixer: THREE.AnimationMixer | null = null
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(gltf.scene)
      const clip = gltf.animations[0]
      if (clip) {
        const action = mixer.clipAction(clip)
        action.play()
      }
    }

    normalizeMesh(gltf.scene)

    return { object: gltf.scene, mixer }
  }

  /**
   * 加载 FBX 模型
   */
  private async loadFBX(file: string, callbacks: ModelLoadCallbacks): Promise<ModelLoadResult> {
    const object = await this.fbxLoader.loadAsync(file, (xhr) => {
      if (xhr.lengthComputable) {
        const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
        callbacks.loading(progress)
      }
    })

    let mixer: THREE.AnimationMixer | null = null
    if (object.animations && object.animations.length > 0) {
      mixer = new THREE.AnimationMixer(object)
      const clip = object.animations[0]
      if (clip) {
        const action = mixer.clipAction(clip)
        action.play()
      }
    }

    normalizeMesh(object)

    return { object, mixer }
  }

  /**
   * 加载 OBJ 模型
   */
  private async loadOBJ(file: string, callbacks: ModelLoadCallbacks): Promise<ModelLoadResult> {
    const mtlPath = file.replace('.obj', '.mtl')
    const texturePath = file.replace(/\.obj$/i, '.png')

    let object: THREE.Object3D

    try {
      object = await this.loadOBJWithMTL(file, mtlPath, callbacks)
    } catch (error) {
      console.warn('MTL加载失败或无效，使用默认材质:', error)
      object = await this.loadOBJOnly(file, callbacks)
      await this.applyDefaultMaterial(object, texturePath)
    }

    return { object, mixer: null }
  }

  /**
   * 加载带 MTL 的 OBJ 模型
   */
  private async loadOBJWithMTL(
    objFile: string,
    mtlFile: string,
    callbacks: ModelLoadCallbacks
  ): Promise<THREE.Object3D> {
    const materials = await this.mtlLoader.loadAsync(mtlFile, (xhr) => {
      if (xhr.lengthComputable) {
        const progress = Math.floor((xhr.loaded / xhr.total) * 30) + 10
        callbacks.loading(progress)
      }
    })

    // 预加载材质
    await new Promise<void>((resolve) => {
      materials.preload()
      setTimeout(resolve, 100)
    })

    const materialsInfo = (materials as any).materialsInfo as Record<string, unknown> | undefined
    if (!materialsInfo || Object.keys(materialsInfo).length === 0) {
      throw new Error('MTL内容为空或无效')
    }

    const loader = new OBJLoader()
    loader.setMaterials(materials)

    const object = await loader.loadAsync(objFile, (xhr) => {
      if (xhr.lengthComputable) {
        const progress = Math.floor((xhr.loaded / xhr.total) * 40) + 40
        callbacks.loading(progress)
      }
    })

    // 验证材质是否正确应用
    let materialApplied = false
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          materialApplied = true
        }
      }
    })

    if (!materialApplied) {
      throw new Error('材质应用失败')
    }

    normalizeMesh(object)

    return object
  }

  /**
   * 仅加载 OBJ 模型
   */
  private async loadOBJOnly(file: string, callbacks: ModelLoadCallbacks): Promise<THREE.Object3D> {
    const object = await this.objLoader.loadAsync(file, (xhr) => {
      if (xhr.lengthComputable) {
        const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
        callbacks.loading(progress)
      }
    })

    normalizeMesh(object)

    return object
  }

  /**
   * 加载 STL 模型
   */
  private async loadSTL(file: string, callbacks: ModelLoadCallbacks): Promise<ModelLoadResult> {
    const geometry = await this.stlLoader.loadAsync(file, (xhr) => {
      if (xhr.lengthComputable) {
        const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
        callbacks.loading(progress)
      }
    })

    let material: THREE.Material
    if ((geometry as any).hasColors) {
      material = new THREE.MeshPhongMaterial({
        opacity: (geometry as any).alpha,
        vertexColors: true
      })
    } else {
      material = new THREE.MeshPhongMaterial({
        color: 0xd5d5d5,
        specular: 0x494949,
        shininess: 200
      })
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true

    normalizeMesh(mesh)

    return { object: mesh, mixer: null }
  }

  /**
   * 加载 STEP/IGES 模型
   */
  private async loadStepIges(file: string, type: Model['type'], callbacks: ModelLoadCallbacks): Promise<ModelLoadResult> {
    const object = await this.stepIgesLoader.load(file, type, callbacks)

    normalizeMesh(object)

    return { object, mixer: null }
  }

  /**
   * 应用默认材质
   */
  private async applyDefaultMaterial(object: THREE.Object3D, textureUrl?: string): Promise<void> {
    let texture: THREE.Texture | null = null
    if (textureUrl) {
      try {
        texture = await this.textureLoader.loadAsync(textureUrl)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.flipY = true
      } catch (error) {
        console.warn('贴图加载失败，回退为纯色材质:', error)
      }
    }

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.geometry && !mesh.geometry.attributes.normal) {
          mesh.geometry.computeVertexNormals()
        }

        // OBJ + 单贴图资源更适合非 PBR 材质，避免在部分贴图资源上出现整体发黑
        mesh.material = new THREE.MeshPhongMaterial({
          map: texture,
          color: 0xffffff,
          side: THREE.DoubleSide,
          shininess: 30,
          specular: 0x222222,
          transparent: Boolean(texture),
          alphaTest: texture ? 0.01 : 0,
          opacity: 1
        })
      }
    })
  }
}

/**
 * 模型后处理工具
 */
export class ModelProcessor {
  /**
   * 创建透明包围盒占位符
   * @param size 包围盒尺寸 (默认估算值)
   * @returns 包围盒网格对象
   */
  static createBboxPlaceholder(size: THREE.Vector3 = new THREE.Vector3(2, 2, 2)): THREE.Group {
    const group = new THREE.Group()
    group.name = 'bbox-placeholder'

    // 创建线框盒子
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x409eff, 
      transparent: true, 
      opacity: 0.6 
    })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)
    wireframe.position.y = size.y / 2
    group.add(wireframe)

    // 创建半透明填充
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: 0x409eff,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide
    })
    const fillMesh = new THREE.Mesh(geometry.clone(), fillMaterial)
    fillMesh.position.y = size.y / 2
    group.add(fillMesh)

    return group
  }

  /**
   * 根据模型更新包围盒占位符
   */
  static updateBboxFromModel(bbox: THREE.Group, object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // 更新线框和填充的尺寸
    bbox.children.forEach(child => {
      if (child instanceof THREE.LineSegments || child instanceof THREE.Mesh) {
        child.geometry.dispose()
        child.geometry = child instanceof THREE.LineSegments 
          ? new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z))
          : new THREE.BoxGeometry(size.x, size.y, size.z)
        child.position.copy(center)
      }
    })
  }

  /**
   * 淡出并移除包围盒
   */
  static fadeOutBbox(bbox: THREE.Group, duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const materials: THREE.Material[] = []
      
      bbox.traverse((child) => {
        if ((child as THREE.Mesh).isMesh || (child as THREE.LineSegments).isLineSegments) {
          const obj = child as THREE.Mesh | THREE.LineSegments
          if (obj.material) {
            materials.push(obj.material as THREE.Material)
          }
        }
      })

      function animate() {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const opacity = 1 - progress

        materials.forEach(mat => {
          if ('opacity' in mat) {
            (mat as THREE.MeshBasicMaterial).opacity *= opacity
          }
        })

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // 清理
          bbox.traverse((child) => {
            if ((child as THREE.Mesh).geometry) {
              (child as THREE.Mesh).geometry.dispose()
            }
            if ((child as THREE.Mesh).material) {
              const mat = (child as THREE.Mesh).material
              if (Array.isArray(mat)) {
                mat.forEach(m => m.dispose())
              } else {
                mat.dispose()
              }
            }
          })
          bbox.parent?.remove(bbox)
          resolve()
        }
      }

      animate()
    })
  }

  /**
   * 渐进显示模型 (从透明到不透明)
   */
  static async revealModel(object: THREE.Object3D, duration: number = 600): Promise<void> {
    const materials: { material: THREE.Material; originalOpacity: number }[] = []
    
    // 收集所有材质并设置为透明
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach(mat => {
          if (mat) {
            const originalOpacity = (mat as THREE.MeshStandardMaterial).opacity ?? 1
            materials.push({ material: mat, originalOpacity })
            mat.transparent = true
            ;(mat as THREE.MeshStandardMaterial).opacity = 0
          }
        })
      }
    })

    // 渐进显示
    return new Promise((resolve) => {
      const startTime = Date.now()

      function animate() {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // 使用 easeOutCubic 缓动
        const eased = 1 - Math.pow(1 - progress, 3)

        materials.forEach(({ material, originalOpacity }) => {
          ;(material as THREE.MeshStandardMaterial).opacity = eased * originalOpacity
        })

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // 恢复原始透明度设置
          materials.forEach(({ material, originalOpacity }) => {
            ;(material as THREE.MeshStandardMaterial).opacity = originalOpacity
            // 如果原本不透明，恢复 transparent 为 false
            if (originalOpacity >= 1) {
              material.transparent = false
            }
          })
          resolve()
        }
      }

      animate()
    })
  }

  /**
   * 设置模型阴影
   */
  static setupShadows(object: THREE.Object3D): void {
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }

  /**
   * 自动调整模型大小
   */
  static autoScale(object: THREE.Object3D, targetSize: number = 3, maxSize: number = 10): void {
    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    if (maxDim < targetSize) {
      const scale = targetSize / maxDim
      object.scale.set(scale, scale, scale)
    } else if (maxDim > maxSize) {
      const scale = maxSize / maxDim
      object.scale.set(scale, scale, scale)
    }
  }

  /**
   * 将模型底部贴地
   */
  static groundModel(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object)
    object.position.y -= box.min.y
  }

  /**
   * 居中模型
   */
  static centerModel(object: THREE.Object3D): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    object.position.sub(center)
    return center
  }
}

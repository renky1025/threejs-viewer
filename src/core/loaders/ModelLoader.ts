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

/**
 * 模型加载器类
 */
export class ModelLoader {
  private gltfLoader: GLTFLoader
  private fbxLoader: FBXLoader
  private objLoader: OBJLoader
  private mtlLoader: MTLLoader
  private stlLoader: STLLoader

  constructor() {
    this.gltfLoader = new GLTFLoader()
    this.fbxLoader = new FBXLoader()
    this.objLoader = new OBJLoader()
    this.mtlLoader = new MTLLoader()
    this.stlLoader = new STLLoader()
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

    return { object, mixer }
  }

  /**
   * 加载 OBJ 模型
   */
  private async loadOBJ(file: string, callbacks: ModelLoadCallbacks): Promise<ModelLoadResult> {
    const mtlPath = file.replace('.obj', '.mtl')
    const mtlExists = await this.checkFileExists(mtlPath)

    let object: THREE.Object3D

    if (mtlExists) {
      try {
        object = await this.loadOBJWithMTL(file, mtlPath, callbacks)
      } catch (error) {
        console.warn('MTL加载失败，使用默认材质:', error)
        object = await this.loadOBJOnly(file, callbacks)
        this.applyDefaultMaterial(object)
      }
    } else {
      object = await this.loadOBJOnly(file, callbacks)
      this.applyDefaultMaterial(object)
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

    return object
  }

  /**
   * 仅加载 OBJ 模型
   */
  private async loadOBJOnly(file: string, callbacks: ModelLoadCallbacks): Promise<THREE.Object3D> {
    return await this.objLoader.loadAsync(file, (xhr) => {
      if (xhr.lengthComputable) {
        const progress = Math.floor((xhr.loaded / xhr.total) * 70) + 10
        callbacks.loading(progress)
      }
    })
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

    return { object: mesh, mixer: null }
  }

  /**
   * 检查文件是否存在
   */
  private async checkFileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 应用默认材质
   */
  private applyDefaultMaterial(object: THREE.Object3D): void {
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          roughness: 0.7,
          metalness: 0.2,
          side: THREE.DoubleSide
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

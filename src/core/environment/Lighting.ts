/**
 * 灯光设置模块
 */
import * as THREE from 'three'

/**
 * 灯光配置选项
 */
export interface LightingOptions {
  /** 环境光强度 */
  ambientIntensity?: number
  /** 半球光强度 */
  hemisphereIntensity?: number
  /** 主方向光强度 */
  directionalIntensity?: number
  /** 补充光强度 */
  fillLightIntensity?: number
  /** 点光源强度 */
  pointLightIntensity?: number
  /** 是否启用阴影 */
  enableShadows?: boolean
}

/**
 * 默认灯光配置 - 优化为更自然的光照
 */
const DEFAULT_LIGHTING_OPTIONS: Required<LightingOptions> = {
  ambientIntensity: 0.6,
  hemisphereIntensity: 0.8,
  directionalIntensity: 1.2,
  fillLightIntensity: 0.4,
  pointLightIntensity: 0.3,
  enableShadows: true
}

/**
 * 灯光管理器
 */
export class LightingManager {
  private scene: THREE.Scene
  private lights: THREE.Light[] = []
  private options: Required<LightingOptions>

  constructor(scene: THREE.Scene, options: LightingOptions = {}) {
    this.scene = scene
    this.options = { ...DEFAULT_LIGHTING_OPTIONS, ...options }
  }

  /**
   * 设置标准场景灯光 - 优化为更自然的光照效果
   */
  setupStandardLighting(): void {
    this.clear()

    // 环境光 - 提供柔和的基础照明
    const ambientLight = new THREE.AmbientLight(0xffffff, this.options.ambientIntensity)
    this.addLight(ambientLight)

    // 半球光 - 模拟天空（蓝色）和地面（暖色）的反射
    const hemisphereLight = new THREE.HemisphereLight(
      0x87ceeb, // 天空色 - 淡蓝色
      0xb97a56, // 地面色 - 暖棕色
      this.options.hemisphereIntensity
    )
    hemisphereLight.position.set(0, 50, 0)
    this.addLight(hemisphereLight)

    // 主方向光 - 模拟太阳光（从右上方照射）
    const directionalLight = new THREE.DirectionalLight(0xfff5e6, this.options.directionalIntensity)
    directionalLight.position.set(8, 15, 10)
    
    if (this.options.enableShadows) {
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      directionalLight.shadow.camera.near = 0.5
      directionalLight.shadow.camera.far = 100
      directionalLight.shadow.camera.left = -30
      directionalLight.shadow.camera.right = 30
      directionalLight.shadow.camera.top = 30
      directionalLight.shadow.camera.bottom = -30
      // 柔和阴影
      directionalLight.shadow.radius = 2
      directionalLight.shadow.bias = -0.0001
    }
    this.addLight(directionalLight)

    // 补充光源 - 从左后方提供柔和补光，减少阴影过暗
    const fillLight = new THREE.DirectionalLight(0xe6f0ff, this.options.fillLightIntensity)
    fillLight.position.set(-8, 8, -8)
    this.addLight(fillLight)

    // 背光 - 从后方提供轮廓光
    const backLight = new THREE.DirectionalLight(0xffffff, 0.2)
    backLight.position.set(0, 5, -10)
    this.addLight(backLight)
  }

  /**
   * 添加灯光到场景
   */
  private addLight(light: THREE.Light): void {
    this.scene.add(light)
    this.lights.push(light)
  }

  /**
   * 清理所有灯光
   */
  clear(): void {
    this.lights.forEach(light => {
      this.scene.remove(light)
      light.dispose()
    })
    this.lights = []
  }

  /**
   * 获取所有灯光
   */
  getLights(): THREE.Light[] {
    return this.lights
  }
}

/**
 * 快捷函数：设置场景灯光
 */
export function setupLighting(scene: THREE.Scene, options?: LightingOptions): LightingManager {
  const manager = new LightingManager(scene, options)
  manager.setupStandardLighting()
  return manager
}

import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { createRealisticSky, disposeSkybox } from './Skybox'

export type EnvPreset = 'sky' | 'studio' | 'outdoor' | 'industrial'

export class EnvironmentManager {
  private scene: THREE.Scene
  private pmremGenerator: THREE.PMREMGenerator
  private envTexture: THREE.Texture | null = null
  private skyMesh: THREE.Mesh | null = null
  private hdrTexture: THREE.DataTexture | null = null

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    this.scene = scene
    this.pmremGenerator = new THREE.PMREMGenerator(renderer)
    this.pmremGenerator.compileEquirectangularShader()
  }

  /**
   * 使用当前的渐变天空盒生成 PBR 环境贴图
   */
  setupSkyEnvironment(): void {
    if (!this.skyMesh) {
      const sky = createRealisticSky(this.scene)
      this.skyMesh = sky
    }

    const envRT = this.pmremGenerator.fromScene(this.skyMesh as unknown as THREE.Scene)

    if (this.envTexture) {
      this.envTexture.dispose()
    }

    this.envTexture = envRT.texture
    this.scene.environment = this.envTexture
  }

  async loadHDR(url: string): Promise<void> {
    const loader = new RGBELoader()
    const hdr = await loader.loadAsync(url)

    const envRT = this.pmremGenerator.fromEquirectangular(hdr)

    if (this.envTexture) {
      this.envTexture.dispose()
    }

    if (this.hdrTexture) {
      this.hdrTexture.dispose()
    }

    this.hdrTexture = hdr
    this.envTexture = envRT.texture
    this.scene.environment = this.envTexture
  }

  async setEnv(preset: EnvPreset, url?: string): Promise<void> {
    if (preset === 'sky') {
      this.setupSkyEnvironment()
      return
    }

    if (!url) {
      console.warn('[EnvironmentManager] setEnv: url is required for preset', preset)
      return
    }

    await this.loadHDR(url)
  }

  dispose(): void {
    if (this.envTexture) {
      this.envTexture.dispose()
      this.envTexture = null
    }

    if (this.hdrTexture) {
      this.hdrTexture.dispose()
      this.hdrTexture = null
    }

    if (this.skyMesh) {
      disposeSkybox(this.skyMesh)
      this.skyMesh = null
    }

    this.pmremGenerator.dispose()
  }
}

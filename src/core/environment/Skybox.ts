/**
 * 天空盒模块
 */
import * as THREE from 'three'

/**
 * 天空盒配置选项
 */
export interface SkyboxOptions {
  /** 顶部颜色 */
  topColor?: number
  /** 底部颜色 */
  bottomColor?: number
  /** 半径 */
  radius?: number
}

/**
 * 默认天空盒配置
 */
const DEFAULT_SKYBOX_OPTIONS: Required<SkyboxOptions> = {
  topColor: 0xc9d6e3,    // 柔和的浅蓝灰色
  bottomColor: 0xffffff, // 纯白色
  radius: 500
}

/**
 * 创建渐变天空盒
 */
export function createRealisticSky(
  scene: THREE.Scene,
  options: SkyboxOptions = {}
): THREE.Mesh {
  const opts = { ...DEFAULT_SKYBOX_OPTIONS, ...options }

  // 创建球体几何体
  const geometry = new THREE.SphereGeometry(opts.radius, 32, 32)

  // 创建渐变材质
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `

  const uniforms = {
    topColor: { value: new THREE.Color(opts.topColor) },
    bottomColor: { value: new THREE.Color(opts.bottomColor) },
    offset: { value: 33 },
    exponent: { value: 0.6 }
  }

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.BackSide
  })

  const sky = new THREE.Mesh(geometry, material)
  scene.add(sky)

  return sky
}

/**
 * 创建纯色背景
 */
export function createSolidBackground(scene: THREE.Scene, color: number): void {
  scene.background = new THREE.Color(color)
}

/**
 * 创建立方体贴图天空盒
 */
export function createCubeMapSky(
  scene: THREE.Scene,
  urls: string[]
): Promise<THREE.CubeTexture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.CubeTextureLoader()
    loader.load(
      urls,
      (texture) => {
        scene.background = texture
        resolve(texture)
      },
      undefined,
      reject
    )
  })
}

/**
 * 清理天空盒
 */
export function disposeSkybox(sky: THREE.Mesh): void {
  if (sky.geometry) sky.geometry.dispose()
  if (sky.material) {
    if (Array.isArray(sky.material)) {
      sky.material.forEach(m => m.dispose())
    } else {
      sky.material.dispose()
    }
  }
}

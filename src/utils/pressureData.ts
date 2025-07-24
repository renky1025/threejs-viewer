/**
 * 压力数据可视化工具
 */
import * as THREE from 'three'
// Import Lut from three/addons - note: this requires Three.js r150+
// If Lut is not available, we'll create a simple color mapping alternative
let Lut: any
try {
  const lutModule = await import('three/addons/math/Lut.js')
  Lut = lutModule.Lut
} catch (error) {
  console.warn('Lut not available, using fallback color mapping')
  // Simple fallback color mapping
  Lut = class SimpleLut {
    private colorMap: string = 'rainbow'
    private min: number = 0
    private max: number = 1
    
    constructor(colorMap?: string, steps?: number) {
      this.colorMap = colorMap || 'rainbow'
    }
    
    setColorMap(colorMap: string) {
      this.colorMap = colorMap
    }
    
    setMin(min: number) {
      this.min = min
    }
    
    setMax(max: number) {
      this.max = max
    }
    
    getColor(value: number) {
      const normalized = (value - this.min) / (this.max - this.min)
      const clamped = Math.max(0, Math.min(1, normalized))
      
      switch (this.colorMap) {
        case 'rainbow':
          return this.getRainbowColor(clamped)
        case 'cooltowarm':
          return this.getCoolToWarmColor(clamped)
        case 'blackbody':
          return this.getBlackbodyColor(clamped)
        case 'grayscale':
          return this.getGrayscaleColor(clamped)
        default:
          return this.getRainbowColor(clamped)
      }
    }
    
    private getRainbowColor(t: number): THREE.Color {
      const hue = (1 - t) * 240 // 从蓝色(240°)到红色(0°)
      return new THREE.Color().setHSL(hue / 360, 1, 0.5)
    }
    
    private getCoolToWarmColor(t: number): THREE.Color {
      const r = t
      const g = 0.5 * (1 - Math.abs(2 * t - 1))
      const b = 1 - t
      return new THREE.Color(r, g, b)
    }
    
    private getBlackbodyColor(t: number): THREE.Color {
      let r, g, b
      
      if (t < 0.25) {
        r = 0
        g = 0
        b = t * 4
      } else if (t < 0.5) {
        r = 0
        g = (t - 0.25) * 4
        b = 1
      } else if (t < 0.75) {
        r = (t - 0.5) * 4
        g = 1
        b = (0.75 - t) * 4
      } else {
        r = 1
        g = (1 - t) * 4
        b = 0
      }
      
      return new THREE.Color(r, g, b)
    }
    
    private getGrayscaleColor(t: number): THREE.Color {
      return new THREE.Color(t, t, t)
    }
    
    createCanvas() {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        this.updateCanvasContext(ctx, canvas.width, canvas.height)
      }
      
      return canvas
    }
    
    updateCanvas(canvas: HTMLCanvasElement) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        this.updateCanvasContext(ctx, canvas.width, canvas.height)
      }
    }
    
    private updateCanvasContext(ctx: CanvasRenderingContext2D, width: number, height: number) {
      for (let i = 0; i < height; i++) {
        const t = i / (height - 1)
        const color = this.getColor(this.min + t * (this.max - this.min))
        ctx.fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`
        ctx.fillRect(0, height - 1 - i, width, 1)
      }
    }
  }
}

/**
 * 颜色映射类型
 */
export type ColorMapType = 'rainbow' | 'cooltowarm' | 'blackbody' | 'grayscale'

/**
 * 压力数据可视化选项
 */
export interface PressureDataOptions {
  colorMap: ColorMapType
  minValue: number
  maxValue: number
}

/**
 * 压力数据可视化结果
 */
export interface PressureVisualization {
  mesh: THREE.Mesh
  legend: THREE.Sprite
  updateColorMap: (colorMap: ColorMapType) => void
  updateRange: (min: number, max: number) => void
  dispose: () => void
}

/**
 * 创建压力数据可视化
 * @param scene Three.js场景
 * @param dataUrl 压力数据JSON文件URL
 * @param options 可视化选项
 * @param callback 加载回调
 * @returns 压力数据可视化对象
 */
export async function createPressureVisualization(
  scene: THREE.Scene,
  dataUrl: string,
  options: PressureDataOptions = { colorMap: 'rainbow', minValue: 0, maxValue: 2000 },
  callback?: {
    loading: (progress: number) => void
    loaded: () => void
    error: (error: any) => void
  }
): Promise<PressureVisualization> {
  // 创建查找表(LUT)
  const lut = new Lut(options.colorMap, 512)
  lut.setMax(options.maxValue)
  lut.setMin(options.minValue)

  // 创建图例精灵
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(lut.createCanvas())
    })
  )
  sprite.material.map.colorSpace = THREE.SRGBColorSpace
  sprite.scale.x = 0.125
  sprite.scale.y = 0.5
  sprite.position.set(0.9, 0, 0) // 右侧位置

  // 创建网格材质
  const material = new THREE.MeshLambertMaterial({
    side: THREE.DoubleSide,
    color: 0xF5F5F5,
    vertexColors: true
  })

  // 创建网格
  const mesh = new THREE.Mesh(undefined, material)
  
  try {
    // 加载几何体
    callback?.loading(10)
    
    const loader = new THREE.BufferGeometryLoader()
    const geometry = await loader.loadAsync(dataUrl, (xhr) => {
      if (xhr.lengthComputable) {
        const progress = Math.floor((xhr.loaded / xhr.total) * 80) + 10
        callback?.loading(progress)
      }
    })
    
    // 处理几何体
    geometry.center()
    geometry.computeVertexNormals()
    
    // 如果没有颜色属性，创建默认颜色
    if (!geometry.attributes.color) {
      const colors = []
      for (let i = 0, n = geometry.attributes.position.count; i < n; ++i) {
        colors.push(1, 1, 1)
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    }
    
    // 设置几何体
    mesh.geometry = geometry
    
    // 更新颜色
    updateColors(mesh, lut)
    
    // 添加到场景
    scene.add(mesh)
    
    callback?.loading(100)
    callback?.loaded()
  } catch (error) {
    console.error('压力数据加载失败:', error)
    callback?.error(error)
    throw error
  }
  
  /**
   * 更新颜色映射
   * @param mesh 网格
   * @param lut 查找表
   */
  function updateColors(mesh: THREE.Mesh, lut: Lut) {
    if (!mesh.geometry) return
    
    const geometry = mesh.geometry
    const pressures = geometry.attributes.pressure
    
    if (!pressures) {
      console.warn('几何体没有压力数据属性')
      return
    }
    
    const colors = geometry.attributes.color
    const color = new THREE.Color()
    
    for (let i = 0; i < pressures.count; i++) {
      const colorValue = pressures.getX(i)
      
      color.copy(lut.getColor(colorValue)).convertSRGBToLinear()
      
      colors.setXYZ(i, color.r, color.g, color.b)
    }
    
    colors.needsUpdate = true
    
    // 更新图例
    const map = sprite.material.map
    lut.updateCanvas(map.image)
    map.needsUpdate = true
  }
  
  // 返回可视化对象
  return {
    mesh,
    legend: sprite,
    
    // 更新颜色映射
    updateColorMap(colorMap: ColorMapType) {
      lut.setColorMap(colorMap)
      updateColors(mesh, lut)
    },
    
    // 更新数值范围
    updateRange(min: number, max: number) {
      lut.setMin(min)
      lut.setMax(max)
      updateColors(mesh, lut)
    },
    
    // 释放资源
    dispose() {
      if (mesh.geometry) {
        mesh.geometry.dispose()
      }
      
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose())
        } else {
          mesh.material.dispose()
        }
      }
      
      if (sprite.material.map) {
        sprite.material.map.dispose()
      }
      
      sprite.material.dispose()
      
      scene.remove(mesh)
      scene.remove(sprite)
    }
  }
}
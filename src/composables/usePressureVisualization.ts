/**
 * 压力数据可视化 Composable
 * 提供压力数据颜色映射和格式化的可复用逻辑
 */
import { ref, computed } from 'vue'
import type { ColorMapType, PressureStats } from '../core/types'

export interface UsePressureVisualizationOptions {
  /** 初始颜色映射 */
  initialColorMap?: ColorMapType
  /** 初始最小值 */
  initialMinValue?: number
  /** 初始最大值 */
  initialMaxValue?: number
}

/**
 * 压力数据可视化 Composable
 */
export function usePressureVisualization(options: UsePressureVisualizationOptions = {}) {
  const {
    initialColorMap = 'rainbow',
    initialMinValue = 0,
    initialMaxValue = 2000
  } = options

  // 状态
  const colorMap = ref<ColorMapType>(initialColorMap)
  const minValue = ref(initialMinValue)
  const maxValue = ref(initialMaxValue)
  const selectedPressure = ref<number | null>(null)
  const pressureStats = ref<PressureStats | null>(null)

  // 压力标签
  const pressureLabels = computed(() => {
    const range = maxValue.value - minValue.value
    const labels: number[] = []
    const labelCount = 8

    for (let i = 0; i <= labelCount; i++) {
      const value = minValue.value + (i / labelCount) * range
      labels.push(value)
    }

    return labels
  })

  // 颜色条渐变
  const colorBarGradient = computed(() => {
    const colors: string[] = []
    const steps = 20

    for (let i = 0; i <= steps; i++) {
      const value = minValue.value + (i / steps) * (maxValue.value - minValue.value)
      const color = getColorForPressure(value)
      colors.push(`${color} ${(i / steps) * 100}%`)
    }

    return `linear-gradient(to top, ${colors.join(', ')})`
  })

  /**
   * 根据压力值获取颜色
   */
  function getColorForPressure(pressure: number): string {
    const normalized = (pressure - minValue.value) / (maxValue.value - minValue.value)
    const clamped = Math.max(0, Math.min(1, normalized))

    switch (colorMap.value) {
      case 'rainbow':
        return getRainbowColor(clamped)
      case 'cooltowarm':
        return getCoolToWarmColor(clamped)
      case 'blackbody':
        return getBlackbodyColor(clamped)
      case 'grayscale':
        return getGrayscaleColor(clamped)
      default:
        return getRainbowColor(clamped)
    }
  }

  /**
   * 彩虹色映射
   */
  function getRainbowColor(t: number): string {
    const hue = (1 - t) * 240
    return `hsl(${hue}, 100%, 50%)`
  }

  /**
   * 冷暖色调映射
   */
  function getCoolToWarmColor(t: number): string {
    const r = Math.floor(t * 255)
    const g = Math.floor(128 * (1 - Math.abs(2 * t - 1)))
    const b = Math.floor((1 - t) * 255)
    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * 黑体辐射色映射
   */
  function getBlackbodyColor(t: number): string {
    let r: number, g: number, b: number

    if (t < 0.25) {
      r = 0
      g = 0
      b = Math.floor(t * 4 * 255)
    } else if (t < 0.5) {
      r = 0
      g = Math.floor((t - 0.25) * 4 * 255)
      b = 255
    } else if (t < 0.75) {
      r = Math.floor((t - 0.5) * 4 * 255)
      g = 255
      b = Math.floor((0.75 - t) * 4 * 255)
    } else {
      r = 255
      g = Math.floor((1 - t) * 4 * 255)
      b = 0
    }

    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * 灰度映射
   */
  function getGrayscaleColor(t: number): string {
    const gray = Math.floor(t * 255)
    return `rgb(${gray}, ${gray}, ${gray})`
  }

  /**
   * 格式化压力值显示
   */
  function formatPressureValue(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    } else {
      return value.toFixed(0)
    }
  }

  /**
   * 设置压力统计数据
   */
  function setPressureStats(stats: PressureStats | null) {
    pressureStats.value = stats
  }

  /**
   * 设置选中的压力值
   */
  function setSelectedPressure(pressure: number | null) {
    selectedPressure.value = pressure
  }

  /**
   * 更新颜色映射
   */
  function setColorMap(map: ColorMapType) {
    colorMap.value = map
  }

  /**
   * 更新数值范围
   */
  function setRange(min: number, max: number) {
    minValue.value = min
    maxValue.value = max
  }

  return {
    // 状态
    colorMap,
    minValue,
    maxValue,
    selectedPressure,
    pressureStats,
    pressureLabels,
    colorBarGradient,
    
    // 方法
    getColorForPressure,
    formatPressureValue,
    setPressureStats,
    setSelectedPressure,
    setColorMap,
    setRange
  }
}

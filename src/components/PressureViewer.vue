<template>
  <div class="pressure-viewer">
    <div ref="container" class="viewer-container"></div>

    <!-- 控制面板 -->
    <div class="control-panel" v-if="!isLoading">
      <div class="panel-header">
        <h3>压力数据可视化</h3>
      </div>

      <div class="panel-content">
        <!-- 颜色映射选择 -->
        <div class="control-group">
          <label>颜色映射:</label>
          <el-select v-model="colorMap" @change="updateColorMap" size="small">
            <el-option label="彩虹" value="rainbow" />
            <el-option label="冷暖色调" value="cooltowarm" />
            <el-option label="黑体辐射" value="blackbody" />
            <el-option label="灰度" value="grayscale" />
          </el-select>
        </div>

        <!-- 数值范围控制 -->
        <div class="control-group">
          <label>最小值:</label>
          <el-input-number v-model="minValue" @change="updateRange" :min="0" :max="maxValue - 1" size="small" />
        </div>

        <div class="control-group">
          <label>最大值:</label>
          <el-input-number v-model="maxValue" @change="updateRange" :min="minValue + 1" :max="5000" size="small" />
        </div>

        <!-- 压力统计 -->
        <div class="control-group" v-if="pressureStats">
          <label>压力统计:</label>
          <div class="pressure-stats">
            <div class="stat-item">
              <span class="stat-label">最小值:</span>
              <span class="stat-value">{{ formatPressureValue(pressureStats.min) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大值:</span>
              <span class="stat-value">{{ formatPressureValue(pressureStats.max) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均值:</span>
              <span class="stat-value">{{ formatPressureValue(pressureStats.avg) }}</span>
            </div>
          </div>
        </div>

        <!-- 压力范围指示器 -->
        <div class="control-group">
          <label>当前显示范围:</label>
          <div class="pressure-range-indicator">
            <div class="range-bar">
              <div class="range-fill" :style="{
                background: `linear-gradient(to right, ${getColorForPressure(minValue)}, ${getColorForPressure(maxValue)})`,
                width: '100%'
              }"></div>
            </div>
            <div class="range-labels">
              <span class="range-min">{{ formatPressureValue(minValue) }}</span>
              <span class="range-max">{{ formatPressureValue(maxValue) }}</span>
            </div>
          </div>
        </div>

        <!-- 重置按钮 -->
        <div class="control-group">
          <el-button @click="reset" size="small" type="primary">
            重置视图
          </el-button>
        </div>
      </div>
    </div>

    <!-- 压力颜色条图例 -->
    <div class="pressure-legend" v-if="!isLoading">
    <div class="legend-title">压力值 (Pa)</div>

    <!-- 颜色条 -->
    <div class="color-bar-container">
      <div class="color-bar" :style="{ background: colorBarGradient }" @mousemove="onColorBarHover"
        @mouseleave="hideColorBarTooltip"></div>

      <!-- 数值标签 -->
      <div class="value-labels">
        <div v-for="(value, index) in pressureLabels" :key="index" class="value-label"
          :style="{ bottom: `${(value - minValue) / (maxValue - minValue) * 100}%` }">
          <span class="label-line"></span>
          <span class="label-text">{{ formatPressureValue(value) }}</span>
        </div>
      </div>

      <!-- 颜色条悬停提示 -->
      <div v-if="colorBarTooltip.show" class="color-bar-tooltip" :style="{
        bottom: `${colorBarTooltip.position}%`,
        backgroundColor: colorBarTooltip.color
      }">
        {{ formatPressureValue(colorBarTooltip.value) }} Pa
      </div>
    </div>

    <!-- 当前选中点的压力值显示 -->
    <div class="current-pressure" v-if="selectedPressure !== null">
      <div class="current-pressure-title">选中点压力:</div>
      <div class="current-pressure-value">{{ formatPressureValue(selectedPressure) }} Pa</div>
      <div class="current-pressure-color" :style="{ backgroundColor: getColorForPressure(selectedPressure) }"></div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createPressureVisualization, type ColorMapType, type PressureVisualization } from '../utils/pressureData'
import type { Model } from '../utils/types'

// 定义组件属性
const props = defineProps<{
  model: Model
}>()

// 定义事件
const emit = defineEmits(['loading', 'loaded', 'error'])

// 组件状态
const container = ref<HTMLDivElement>()
const isLoading = ref(true)

// 控制参数
const colorMap = ref<ColorMapType>('rainbow')
const minValue = ref(0)
const maxValue = ref(2000)

// 压力显示相关
const selectedPressure = ref<number | null>(null)
const pressureLabels = ref<number[]>([])
const colorBarGradient = ref<string>('')
const pressureStats = ref<{ min: number; max: number; avg: number } | null>(null)
const colorBarTooltip = ref({
  show: false,
  position: 0,
  value: 0,
  color: '#000'
})

// Three.js 对象
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let pressureViz: PressureVisualization | null = null
let animationId: number

/**
 * 初始化Three.js场景
 */
async function init() {
  if (!container.value || !props.model) return

  try {
    // 创建场景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)

    // 创建相机
    const width = container.value.clientWidth
    const height = container.value.clientHeight
    camera = new THREE.PerspectiveCamera(60, width / height, 1, 100)
    camera.position.set(0, 0, 10)

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    container.value.appendChild(renderer.domElement)

    // 创建控制器
    controls = new OrbitControls(camera, renderer.domElement)
    controls.addEventListener('change', render)

    // 添加灯光
    const pointLight = new THREE.PointLight(0xffffff, 3, 0, 0)
    camera.add(pointLight)
    scene.add(camera)

    // 创建压力数据可视化
    pressureViz = await createPressureVisualization(
      scene,
      props.model.file,
      {
        colorMap: colorMap.value,
        minValue: minValue.value,
        maxValue: maxValue.value
      },
      {
        loading: (progress: number) => emit('loading', progress),
        loaded: () => {
          isLoading.value = false
          emit('loaded')
        },
        error: (error: any) => {
          isLoading.value = false
          emit('error', error)
        }
      }
    )

    // 添加图例到场景
    scene.add(pressureViz.legend)

    // 计算压力统计
    calculatePressureStats()

    // 处理窗口大小变化
    window.addEventListener('resize', onWindowResize)

    // 添加鼠标交互
    setupMouseInteraction()

    // 初始化压力标签和颜色条
    updatePressureLabels()
    updateColorBarGradient()

    // 开始渲染循环
    animate()

  } catch (e) {
    console.error('压力数据可视化初始化失败:', e)
    isLoading.value = false
    emit('error', e)
  }
}

/**
 * 窗口大小变化处理
 */
function onWindowResize() {
  if (!camera || !renderer || !container.value) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
  render()
}

/**
 * 渲染函数
 */
function render() {
  if (!renderer || !scene || !camera) return
  renderer.render(scene, camera)
}

/**
 * 动画循环
 */
function animate() {
  animationId = requestAnimationFrame(animate)

  if (controls) {
    controls.update()
  }

  render()
}

/**
 * 更新颜色映射
 */
function updateColorMap() {
  console.log('更新颜色映射:', colorMap.value)
  if (pressureViz) {
    pressureViz.updateColorMap(colorMap.value)
    updateColorBarGradient()
    render()
  }
}

/**
 * 更新数值范围
 */
function updateRange() {
  if (pressureViz) {
    pressureViz.updateRange(minValue.value, maxValue.value)
    updatePressureLabels()
    updateColorBarGradient()
    render()
  }
}

/**
 * 更新压力标签
 */
function updatePressureLabels() {
  const range = maxValue.value - minValue.value
  const labels = []

  // 创建更智能的标签分布
  const labelCount = 8 // 减少标签数量以避免重叠

  for (let i = 0; i <= labelCount; i++) {
    const value = minValue.value + (i / labelCount) * range
    labels.push(value)
  }

  pressureLabels.value = labels
}

/**
 * 更新颜色条渐变
 */
function updateColorBarGradient() {
  const colors = []
  const steps = 20

  for (let i = 0; i <= steps; i++) {
    const value = minValue.value + (i / steps) * (maxValue.value - minValue.value)
    const color = getColorForPressure(value)
    colors.push(`${color} ${(i / steps) * 100}%`)
  }

  colorBarGradient.value = `linear-gradient(to top, ${colors.join(', ')})`
}

/**
 * 根据压力值获取颜色
 */
function getColorForPressure(pressure: number): string {
  const normalized = (pressure - minValue.value) / (maxValue.value - minValue.value)
  const clamped = Math.max(0, Math.min(1, normalized))

  // 根据颜色映射类型返回不同的颜色
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
  const hue = (1 - t) * 240 // 从蓝色(240°)到红色(0°)
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
  let r, g, b

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
 * 计算压力统计数据
 */
function calculatePressureStats() {
  if (!pressureViz || !pressureViz.mesh.geometry) return

  const geometry = pressureViz.mesh.geometry
  const pressureAttribute = geometry.attributes.pressure

  if (!pressureAttribute) return

  let min = Infinity
  let max = -Infinity
  let sum = 0
  const count = pressureAttribute.count

  for (let i = 0; i < count; i++) {
    const value = pressureAttribute.getX(i)
    min = Math.min(min, value)
    max = Math.max(max, value)
    sum += value
  }

  pressureStats.value = {
    min,
    max,
    avg: sum / count
  }
}

/**
 * 颜色条悬停处理
 */
function onColorBarHover(event: MouseEvent) {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const y = event.clientY - rect.top
  const height = rect.height
  const position = ((height - y) / height) * 100 // 从底部开始计算

  const value = minValue.value + (position / 100) * (maxValue.value - minValue.value)
  const color = getColorForPressure(value)

  colorBarTooltip.value = {
    show: true,
    position,
    value,
    color
  }
}

/**
 * 隐藏颜色条提示
 */
function hideColorBarTooltip() {
  colorBarTooltip.value.show = false
}

/**
 * 设置鼠标交互
 */
function setupMouseInteraction() {
  if (!renderer || !camera || !scene) return

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const onMouseMove = (event: MouseEvent) => {
    if (!container.value || !pressureViz) return

    const rect = container.value.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera!)
    const intersects = raycaster.intersectObject(pressureViz.mesh)

    if (intersects.length > 0) {
      const intersection = intersects[0]
      const geometry = pressureViz.mesh.geometry

      if (geometry && geometry.attributes.pressure && intersection.face) {
        // 获取面的顶点索引
        const face = intersection.face
        const pressureAttribute = geometry.attributes.pressure
        // 获取三个顶点的压力值并取平均值
        const pressure1 = pressureAttribute.getX(face.a)
        const pressure2 = pressureAttribute.getX(face.b)
        const pressure3 = pressureAttribute.getX(face.c)
        const avgPressure = (pressure1 + pressure2 + pressure3) / 3

        selectedPressure.value = avgPressure
      }
    } else {
      selectedPressure.value = null
    }
  }

  renderer.domElement.addEventListener('mousemove', onMouseMove)
}

/**
 * 重置视图
 */
function reset() {
  if (camera && controls) {
    camera.position.set(0, 0, 10)
    controls.target.set(0, 0, 0)
    controls.update()
    render()
  }
}

/**
 * 清理资源
 */
function dispose() {
  // 停止动画循环
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  // 移除事件监听器
  window.removeEventListener('resize', onWindowResize)

  // 清理压力可视化
  if (pressureViz) {
    pressureViz.dispose()
    pressureViz = null
  }

  // 清理控制器
  if (controls) {
    controls.dispose()
    controls = null
  }

  // 清理渲染器
  if (renderer) {
    renderer.dispose()
    renderer = null
  }

  // 清理场景
  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      }
    })
    scene = null
  }

  camera = null
}

// 暴露组件方法
defineExpose({ reset })

// 生命周期钩子
onMounted(init)
onBeforeUnmount(dispose)
</script>

<style scoped>
.pressure-viewer {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.viewer-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.control-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 250px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 50;
}

.panel-header {
  margin-bottom: 16px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-group label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.pressure-stats {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 8px;
  font-size: 11px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.pressure-legend {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 120px;
}

.legend-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
  text-align: center;
}

.color-bar-container {
  position: relative;
  height: 200px;
  margin-bottom: 16px;
}

.color-bar {
  width: 20px;
  height: 100%;
  border-radius: 10px;
  border: 1px solid #ddd;
  margin: 0 auto;
  position: relative;
}

.value-labels {
  position: absolute;
  left: 30px;
  top: 0;
  height: 100%;
  width: 60px;
}

.value-label {
  position: absolute;
  display: flex;
  align-items: center;
  font-size: 10px;
  color: #666;
  white-space: nowrap;
}

.label-line {
  width: 8px;
  height: 1px;
  background-color: #999;
  margin-right: 4px;
}

.label-text {
  font-weight: 500;
}

.current-pressure {
  border-top: 1px solid #eee;
  padding-top: 12px;
  text-align: center;
}

.current-pressure-title {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.current-pressure-value {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.current-pressure-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin: 0 auto;
}

.color-bar-tooltip {
  position: absolute;
  left: 25px;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  border: 1px solid #fff;
}

.color-bar-tooltip::before {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 4px solid transparent;
  border-right-color: rgba(0, 0, 0, 0.8);
}

.color-bar {
  cursor: crosshair;
  transition: box-shadow 0.2s ease;
}

.color-bar:hover {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.pressure-range-indicator {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 8px;
}

.range-bar {
  height: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  overflow: hidden;
  margin-bottom: 4px;
}

.range-fill {
  height: 100%;
  border-radius: 3px;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #666;
}

.range-min,
.range-max {
  font-weight: 600;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .control-panel {
    width: 200px;
    top: 70px;
    left: 10px;
    padding: 12px;
    z-index: 40;
  }

  .pressure-legend {
    right: 10px;
    padding: 12px;
    min-width: 100px;
  }

  .color-bar-container {
    height: 150px;
  }

  .value-labels {
    width: 50px;
  }

  .value-label {
    font-size: 9px;
  }
}
</style>
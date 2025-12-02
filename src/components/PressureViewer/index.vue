<template>
  <div class="pressure-viewer">
    <div ref="container" class="viewer-container"></div>

    <!-- 控制面板 -->
    <PressureControlPanel
      v-if="!isLoading"
      v-model:colorMap="colorMap"
      v-model:minValue="minValue"
      v-model:maxValue="maxValue"
      :pressure-stats="pressureStats"
      :get-color-for-pressure="getColorForPressure"
      :format-pressure-value="formatPressureValue"
      @color-map-change="updateColorMap"
      @range-change="updateRange"
      @reset="reset"
    />

    <!-- 压力颜色条图例 -->
    <PressureLegend
      v-if="!isLoading"
      :color-bar-gradient="colorBarGradient"
      :pressure-labels="pressureLabels"
      :min-value="minValue"
      :max-value="maxValue"
      :selected-pressure="selectedPressure"
      :get-color-for-pressure="getColorForPressure"
      :format-pressure-value="formatPressureValue"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createPressureVisualization, type PressureVisualization } from '../../utils/pressureData'
import { usePressureVisualization } from '../../composables'
import type { Model } from '../../core/types'
import PressureControlPanel from './PressureControlPanel.vue'
import PressureLegend from './PressureLegend.vue'

// Props
const props = defineProps<{
  model: Model
}>()

// Emits
const emit = defineEmits(['loading', 'loaded', 'error'])

// Refs
const container = ref<HTMLDivElement>()
const isLoading = ref(true)

// 使用 composable
const {
  colorMap,
  minValue,
  maxValue,
  selectedPressure,
  pressureStats,
  pressureLabels,
  colorBarGradient,
  getColorForPressure,
  formatPressureValue,
  setPressureStats,
  setSelectedPressure
} = usePressureVisualization()

// Three.js 对象
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let pressureViz: PressureVisualization | null = null
let animationId: number

/**
 * 初始化场景
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
        error: (error: unknown) => {
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
  if (controls) controls.update()
  render()
}

/**
 * 更新颜色映射
 */
function updateColorMap() {
  if (pressureViz) {
    pressureViz.updateColorMap(colorMap.value)
    render()
  }
}

/**
 * 更新数值范围
 */
function updateRange() {
  if (pressureViz) {
    pressureViz.updateRange(minValue.value, maxValue.value)
    render()
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

  setPressureStats({ min, max, avg: sum / count })
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
      if (!intersection) {
        setSelectedPressure(null)
        return
      }
      
      const geometry = pressureViz.mesh.geometry

      if (geometry && geometry.attributes.pressure && intersection.face) {
        const face = intersection.face
        const pressureAttribute = geometry.attributes.pressure
        const pressure1 = pressureAttribute.getX(face.a)
        const pressure2 = pressureAttribute.getX(face.b)
        const pressure3 = pressureAttribute.getX(face.c)
        const avgPressure = (pressure1 + pressure2 + pressure3) / 3

        setSelectedPressure(avgPressure)
      }
    } else {
      setSelectedPressure(null)
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
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onWindowResize)

  if (pressureViz) {
    pressureViz.dispose()
    pressureViz = null
  }

  if (controls) {
    controls.dispose()
    controls = null
  }

  if (renderer) {
    renderer.dispose()
    renderer = null
  }

  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose())
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

// 暴露方法
defineExpose({ reset })

// 生命周期
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
</style>

<template>
  <div class="model-viewer" @click="onViewerClick">
    <div ref="container" class="viewer-container"></div>
    
    <!-- 顶部工具栏 -->
    <ViewerToolbar
      v-if="!loading"
      :transform-mode="transformMode"
      :is-rotating="isRotating"
      @set-mode="setTransformMode"
      @reset="reset"
      @toggle-rotate="toggleRotate"
      @toggle-clipping="toggleClippingPanel"
      @toggle-explode="toggleExplodePanel"
      @toggle-measure="toggleMeasurePanel"
      @toggle-scene-graph="toggleSceneGraphPanel"
    />

    <ClippingPanel
      v-if="!loading && showClippingPanel"
      @change="handleClippingChange"
      @reset="handleClippingReset"
    />

    <ExplodedPanel
      v-if="!loading && showExplodePanel"
      @change="handleExplodeChange"
      @reset="handleExplodeReset"
    />

    <MeasurementPanel
      v-if="!loading && showMeasurePanel"
      :result="measureResult"
      @clear="handleMeasureClear"
    />

    <SceneGraphPanel
      v-if="!loading && showSceneGraphPanel"
      :nodes="sceneNodes"
      @toggle-visible="handleNodeVisible"
      @change-opacity="handleNodeOpacity"
      @toggle-lock="handleNodeLock"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { loadModel } from '../../utils/threeLoader'
import type { Model, GroundType, ThreeInstance, TransformMode, ClippingAxis, SceneNode, MeasureResult } from '../../core/types'
import ViewerToolbar from './ViewerToolbar.vue'
import ClippingPanel from './ClippingPanel.vue'
import ExplodedPanel from './ExplodedPanel.vue'
import SceneGraphPanel from './SceneGraphPanel.vue'
import MeasurementPanel from './MeasurementPanel.vue'

// Props
const props = defineProps<{ 
  model: Model
  ground: GroundType 
}>()

// Emits
const emit = defineEmits(['loading', 'loaded', 'error'])

// Refs
const container = ref<HTMLDivElement>()
const loading = ref(true)
let threeInstance: ThreeInstance | null = null
let initToken = 0

// 模型变换状态
const position = reactive({ x: 0, y: 0, z: 0 })
const rotation = reactive({ x: 0, y: 0, z: 0 })
const scale = ref(1)

// 变换模式
const transformMode = ref<TransformMode>('translate')
const isRotating = ref(true)
const showClippingPanel = ref(false)
const showExplodePanel = ref(false)
const showSceneGraphPanel = ref(false)
const sceneNodes = ref<SceneNode[]>([])
const showMeasurePanel = ref(false)
const measureResult = ref<MeasureResult | null>(null)

/**
 * 设置变换模式
 */
function setTransformMode(mode: TransformMode) {
  transformMode.value = mode
  if (threeInstance) {
    threeInstance.setTransformMode?.(mode)
  }
}

/**
 * 初始化Three.js场景
 */
async function init() {
  if (!container.value || !props.model) return
  const token = ++initToken
  loading.value = true
  emit('loading', 0)

  if (threeInstance) {
    threeInstance.dispose()
    threeInstance = null
  }
  
  try {
    // 重置变换状态
    position.x = position.y = position.z = 0
    rotation.x = rotation.y = rotation.z = 0
    scale.value = 1
    showClippingPanel.value = false
    showExplodePanel.value = false
    showSceneGraphPanel.value = false
    showMeasurePanel.value = false
    sceneNodes.value = []
    measureResult.value = null
    
    // 加载模型
    threeInstance = await loadModel(container.value, props.model, props.ground, {
      loading: (progress: number) => {
        if (token !== initToken) return
        emit('loading', progress)
      },
      loaded: () => {
        if (token !== initToken) return
        loading.value = false
        emit('loaded')
        // 初始化立方体控制器
        setTimeout(() => {
          if (token !== initToken) return
          threeInstance?.initCubeControl?.()
        }, 100)
      },
      error: (error: unknown) => {
        if (token !== initToken) return
        loading.value = false
        emit('error', error)
      }
    })

    if (token !== initToken) {
      threeInstance?.dispose()
      threeInstance = null
      return
    }
    
    // 设置初始变换模式
    if (threeInstance) {
      threeInstance.setTransformMode?.(transformMode.value)
      if (threeInstance.getSceneGraph) {
        sceneNodes.value = threeInstance.getSceneGraph() || []
      }
      if (threeInstance.getMeasureResult) {
        measureResult.value = threeInstance.getMeasureResult()
      }
    }
  } catch (e) {
    if (token !== initToken) return
    console.error('模型加载失败:', e)
    loading.value = false
    emit('error', e)
  }
}

/**
 * 重置视图
 */
function reset() {
  position.x = position.y = position.z = 0
  rotation.x = rotation.y = rotation.z = 0
  scale.value = 1
  threeInstance?.resetView?.()
}

/**
 * 更新模型变换
 */
function updateTransform() {
  if (threeInstance) {
    threeInstance.updateTransform(
      [position.x, position.y, position.z],
      [rotation.x, rotation.y, rotation.z],
      scale.value
    )
  }
}

/**
 * 添加立方体控制器
 */
function addCubeControl(dom: HTMLDivElement) {
  if (threeInstance) {
    threeInstance.addCubeControl(dom)
  }
}

/**
 * 切换自动旋转
 */
function toggleRotate() {
  if (!threeInstance) return
  if (isRotating.value) {
    threeInstance.stopAutoRotate()
    isRotating.value = false
  } else {
    threeInstance.startAutoRotate()
    isRotating.value = true
  }
}

function toggleClippingPanel() {
  showClippingPanel.value = !showClippingPanel.value
}

function handleClippingChange(axis: ClippingAxis, enabled: boolean, value: number) {
  if (!threeInstance) return
  if (enabled) {
    threeInstance.toggleClippingAxis?.(axis, true)
    threeInstance.setClippingPlane?.(axis, value)
  } else {
    threeInstance.toggleClippingAxis?.(axis, false)
  }
}

function handleClippingReset() {
  if (!threeInstance) return
  threeInstance.resetClipping?.()
}

function toggleExplodePanel() {
  showExplodePanel.value = !showExplodePanel.value
}

function handleExplodeChange(factor: number) {
  if (!threeInstance) return
  threeInstance.setExplodeFactor?.(factor)
}

function handleExplodeReset() {
  if (!threeInstance) return
  threeInstance.resetExplode?.()
}

function refreshMeasureResult() {
  if (!threeInstance || !threeInstance.getMeasureResult) {
    measureResult.value = null
    return
  }
  measureResult.value = threeInstance.getMeasureResult()
}

function toggleMeasurePanel() {
  showMeasurePanel.value = !showMeasurePanel.value
  if (showMeasurePanel.value) {
    threeInstance?.enableMeasure?.()
    refreshMeasureResult()
  } else {
    threeInstance?.disableMeasure?.()
  }
}

function handleMeasureClear() {
  if (!threeInstance) return
  threeInstance.clearMeasure?.()
  refreshMeasureResult()
}

function onViewerClick() {
  if (!showMeasurePanel.value) return
  refreshMeasureResult()
}

function toggleSceneGraphPanel() {
  showSceneGraphPanel.value = !showSceneGraphPanel.value
  if (showSceneGraphPanel.value && threeInstance?.getSceneGraph) {
    sceneNodes.value = threeInstance.getSceneGraph() || []
  }
}

function handleNodeVisible(id: string, visible: boolean) {
  if (!threeInstance) return
  threeInstance.applyNodeVisibility?.(id, visible)
}

function handleNodeOpacity(id: string, opacity: number) {
  if (!threeInstance) return
  threeInstance.applyNodeOpacity?.(id, opacity)
}

function handleNodeLock(id: string, locked: boolean) {
  if (!threeInstance) return
  threeInstance.applyNodeLock?.(id, locked)
}

// 暴露组件方法
defineExpose({ reset, addCubeControl, updateTransform })

// 监听属性变化
watch(() => [props.model, props.ground], () => {
  init()
}, { immediate: true })

watch(() => loading.value, (val) => {
  if (!val && threeInstance) {
    threeInstance.startAutoRotate()
    isRotating.value = true
  }
})

onMounted(init)

onBeforeUnmount(() => {
  initToken += 1
  if (threeInstance) {
    threeInstance.dispose()
    threeInstance = null
  }
})
</script>

<style scoped>
.model-viewer {
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

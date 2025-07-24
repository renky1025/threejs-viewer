<template>
  <div class="model-viewer">
    <div ref="container" class="viewer-container"></div>
    
    <!-- 顶部工具栏 -->
    <div class="toolbar" v-if="!loading">
      <el-button-group>
        <el-tooltip content="平移模式" placement="bottom">
          <el-button :type="transformMode === 'translate' ? 'primary' : ''" @click="setTransformMode('translate')">
            <el-icon><Rank /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="旋转模式" placement="bottom">
          <el-button :type="transformMode === 'rotate' ? 'primary' : ''" @click="setTransformMode('rotate')">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="缩放模式" placement="bottom">
          <el-button :type="transformMode === 'scale' ? 'primary' : ''" @click="setTransformMode('scale')">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="复位视图" placement="bottom">
          <el-button @click="reset">
            <el-icon><Monitor /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import { loadModel } from '../utils/threeLoader'
import type { Model, GroundType, ThreeInstance } from '../utils/types'
import { Rank, Refresh, ZoomIn, Monitor } from '@element-plus/icons-vue'
// Using simple text icons instead of @element-plus/icons-vue to avoid dependency issues
// 定义组件属性
const props = defineProps<{ 
  model: Model, 
  ground: GroundType 
}>()

// 定义事件
const emit = defineEmits(['loading', 'loaded', 'error'])

// 组件状态
const container = ref<HTMLDivElement>()
const loading = ref(true)
let threeInstance: ThreeInstance | null = null

// 模型变换状态
const position = reactive({ x: 0, y: 0, z: 0 })
const rotation = reactive({ x: 0, y: 0, z: 0 })
const scale = ref(1)

// 变换模式
const transformMode = ref<'translate' | 'rotate' | 'scale'>('translate')

/**
 * 设置变换模式
 * @param mode 变换模式
 */
function setTransformMode(mode: 'translate' | 'rotate' | 'scale') {
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
  
  try {
    // 重置变换状态
    position.x = position.y = position.z = 0
    rotation.x = rotation.y = rotation.z = 0
    scale.value = 1
    
    // 加载模型
    threeInstance = await loadModel(container.value, props.model, props.ground, {
      loading: (progress: number) => emit('loading', progress),
      loaded: () => {
        loading.value = false
        emit('loaded')
        // 初始化立方体控制器 - 确保在模型加载完成后调用
        setTimeout(() => {
          threeInstance?.initCubeControl?.()
        }, 100)
      },
      error: (error: any) => {
        loading.value = false
        emit('error', error)
      }
    })
    
    // 设置初始变换模式
    if (threeInstance) {
      threeInstance.setTransformMode?.(transformMode.value)
    }
  } catch (e) {
    console.error('模型加载失败:', e)
    loading.value = false
    emit('error', e)
  }
}

/**
 * 重置视图
 */
function reset() {
  // 重置变换状态
  position.x = position.y = position.z = 0
  rotation.x = rotation.y = rotation.z = 0
  scale.value = 1
  
  // 重置视图
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
 * 初始化立方体控制器
 */
function initCubeControl() {
  if (threeInstance) {
    // 立方体控制器会在threeLoader内部创建，不需要外部DOM元素
    threeInstance.initCubeControl?.()
  }
}

/**
 * 添加立方体控制器
 * @param dom 立方体控制器容器
 */
function addCubeControl(dom: HTMLDivElement) {
  if (threeInstance) {
    threeInstance.addCubeControl(dom)
  }
}

// 暴露组件方法
defineExpose({ reset, addCubeControl })

// 监听属性变化，重新初始化
watch(() => [props.model, props.ground], init, { immediate: true })

// 生命周期钩子
onMounted(init)
onBeforeUnmount(() => {
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
  height: 100vh; /* 全屏高度 */
  overflow: hidden;
}

.viewer-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.toolbar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 5px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
}

/* 确保按钮组内的按钮有合适的间距和样式 */
.toolbar :deep(.el-button) {
  margin: 0 2px;
  padding: 8px 12px;
}

.toolbar :deep(.el-button i) {
  font-size: 18px;
}
</style>
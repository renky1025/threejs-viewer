<template>
  <div class="model-page-container">
    <!-- 返回按钮 -->
    <div class="back-button">
      <el-button type="primary" @click="goBack" circle><el-icon><ArrowLeftBold /></el-icon></el-button>
    </div>
    
    <!-- 地面材质选择 (仅在非压力数据模型时显示) -->
    <div class="ground-selector" v-if="model && model.type !== 'json'">
      <el-select v-model="ground" placeholder="地面材质" size="small">
        <el-option label="基础材质" value="material" />
        <el-option label="木地板" value="floor" />
        <el-option label="草地" value="grass" />
      </el-select>
    </div>
    
    <!-- 加载进度条 -->
    <LoadingBar v-if="loading" :progress="progress" />
    
    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      title="模型加载失败"
      type="error"
      description="无法加载请求的模型，请检查模型文件是否存在或格式是否正确。"
      show-icon
      :closable="false"
      class="error-alert"
    />
    
    <!-- 模型查看器 -->
    <template v-if="!error">
      <!-- 压力数据可视化 -->
      <PressureViewer
        v-if="model && model.type === 'json'"
        :model="model"
        @loading="onLoading"
        @loaded="onLoaded"
        @error="onError"
        ref="viewerRef"
      />
      <!-- 普通3D模型查看器 -->
      <ModelViewer
        v-else-if="model"
        :model="model"
        :ground="ground"
        @loading="onLoading"
        @loaded="onLoaded"
        @error="onError"
        ref="viewerRef"
      />
    </template>
    
    <!-- 模型名称显示 -->
    <div class="model-name" v-if="model && !loading">
      {{ model.name }} ({{ model.type.toUpperCase() }})
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useModelStore } from '../store'
import ModelViewer from '@/components/ModelViewer.vue'
import PressureViewer from '@/components/PressureViewer.vue'
import LoadingBar from '@/components/LoadingBar.vue'
import type { GroundType } from '../utils/types'
import { ArrowLeftBold } from '@element-plus/icons-vue'

// 路由
const route = useRoute()
const router = useRouter()

// 模型存储
const store = useModelStore()

// 当前模型
const model = computed(() => store.models.find(m => m.name === route.params.name))

// 组件状态
const loading = ref(true)
const progress = ref(0)
const error = ref(false)
const ground = ref<GroundType>('material') // 默认使用网格线地面
const viewerRef = ref()

/**
 * 加载进度处理函数
 * @param val 加载进度值
 */
function onLoading(val: number) { 
  loading.value = true
  progress.value = val 
}

/**
 * 加载完成处理函数
 */
function onLoaded() { 
  loading.value = false 
  error.value = false
}

/**
 * 加载错误处理函数
 */
function onError() { 
  loading.value = false 
  error.value = true
}

/**
 * 返回首页
 */
function goBack() { 
  router.push('/') 
}

/**
 * 重置视图
 */
function resetView() { 
  viewerRef.value?.reset() 
}

/**
 * 获取分类名称
 * @param category 分类代码
 * @returns 分类名称
 */
function getCategoryName(category: string): string {
  switch (category) {
    case 'helmet':
      return '头盔'
    case 'character':
      return '人物'
    case 'furniture':
      return '家具'
    default:
      return category
  }
}
</script>

<style scoped>
.model-page-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #000;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
}

.ground-selector {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
}

.error-alert {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  width: 80%;
  max-width: 500px;
}

.model-name {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 100;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .back-button,
  .ground-selector {
    top: 10px;
  }
  
  .back-button {
    left: 10px;
  }
  
  .ground-selector {
    right: 10px;
  }
  
  .model-name {
    bottom: 10px;
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>
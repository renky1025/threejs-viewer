<template>
  <div class="model-page-container">
    <!-- 返回按钮 -->
    <div class="back-button">
      <el-button type="primary" @click="goBack" circle><el-icon><ArrowLeftBold /></el-icon></el-button>
    </div>
    
    <!-- 加载进度条 -->
    <LoadingBar v-if="loading" :progress="progress" />
    
    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="errorTitle"
      type="error"
      :description="errorDescription"
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
      {{ modelDisplayName }} ({{ model.type.toUpperCase() }})
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useModelStore } from '../store'
import ModelViewer from '@/components/ModelViewer/index.vue'
import PressureViewer from '@/components/PressureViewer/index.vue'
import LoadingBar from '@/components/LoadingBar.vue'
import type { GroundType, Model } from '../utils/types'
import { buildRemoteModelFromQuery } from '../utils/remoteModel'
import { ArrowLeftBold } from '@element-plus/icons-vue'
import { getErrorMessage, useToast } from '@/composables/useToast'

// 路由
const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

// 模型存储
const store = useModelStore()

const remoteModel = computed<Model | null>(() =>
  buildRemoteModelFromQuery(route.query as Record<string, any>)
)

const model = computed<Model | undefined>(() => {
  if (remoteModel.value) {
    return remoteModel.value
  }
  return store.models.find(m => m.name === route.params.name)
})
const modelDisplayName = computed(() => {
  const name = model.value?.name || ''
  return name.split('__uploaded_')[0] || name
})

// 组件状态
const loading = ref(true)
const progress = ref(0)
const error = ref(false)
const errorTitle = ref('模型加载失败')
const errorDescription = ref('无法加载请求的模型，请检查模型文件是否存在或格式是否正确。')
const ground = ref<GroundType>('material') // 默认使用网格线地面
const viewerRef = ref()

function setPageError(title: string, description: string) {
  loading.value = false
  error.value = true
  errorTitle.value = title
  errorDescription.value = description
}

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
  errorTitle.value = '模型加载失败'
  errorDescription.value = '无法加载请求的模型，请检查模型文件是否存在或格式是否正确。'
  if (model.value) {
    showToast({ type: 'success', message: `模型加载完成：${modelDisplayName.value}` })
  }
}

/**
 * 加载错误处理函数
 */
function onError(reason?: unknown) { 
  setPageError('模型加载失败', '无法加载请求的模型，请检查模型文件是否存在或格式是否正确。')
  showToast({
    type: 'error',
    message: getErrorMessage(reason, '模型加载失败，请检查文件是否可用')
  })
}

/**
 * 返回首页
 */
function goBack() { 
  router.push('/') 
}

watch(
  () => model.value,
  (currentModel) => {
    if (currentModel || remoteModel.value) {
      return
    }

    const routeName = typeof route.params.name === 'string' ? route.params.name : ''
    const isUploadedModel = routeName.includes('__uploaded_')
    if (isUploadedModel) {
      setPageError('上传模型已失效', '本地上传文件在页面刷新后无法直接恢复，请返回首页重新上传。')
      showToast({ type: 'warning', message: '上传模型在刷新后失效，请重新上传文件' })
      return
    }

    setPageError('未找到模型', '请求的模型不存在，可能已被移除，请返回首页重新选择。')
    showToast({ type: 'error', message: '未找到模型，请返回首页重新选择' })
  },
  { immediate: true }
)

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
  .back-button {
    top: 10px;
  }
  
  .back-button {
    left: 10px;
  }
  
  .model-name {
    bottom: 10px;
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>

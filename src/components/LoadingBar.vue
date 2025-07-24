<template>
  <div class="loading-container">
    <div class="loading-content">
      <h3>加载模型中...</h3>
      <el-progress 
        :percentage="progress" 
        :status="progress >= 100 ? 'success' : 'active'"
        :stroke-width="15"
        :show-text="true"
      />
      <div class="loading-message">{{ loadingMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定义组件属性
const props = defineProps<{ progress: number }>()

// 根据进度计算加载消息
const loadingMessage = computed(() => {
  if (props.progress < 20) {
    return '初始化场景...'
  } else if (props.progress < 50) {
    return '下载模型数据...'
  } else if (props.progress < 80) {
    return '处理模型...'
  } else if (props.progress < 100) {
    return '应用材质和纹理...'
  } else {
    return '加载完成!'
  }
})
</script>

<style scoped>
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.loading-content {
  width: 80%;
  max-width: 500px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.loading-message {
  margin-top: 10px;
  text-align: center;
  color: #606266;
  font-size: 14px;
}
</style>
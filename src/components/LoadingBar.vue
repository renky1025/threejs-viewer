<template>
  <div class="loading-bar">
    <div class="loading-info">
      <span class="loading-text">{{ loadingMessage }}</span>
      <span class="loading-percent">{{ progress }}%</span>
    </div>
    <div class="progress-track">
      <div 
        class="progress-fill" 
        :style="{ width: `${progress}%` }"
        :class="{ 'complete': progress >= 100 }"
      ></div>
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
    return '初始化场景'
  } else if (props.progress < 50) {
    return '下载模型'
  } else if (props.progress < 80) {
    return '处理模型'
  } else if (props.progress < 100) {
    return '应用材质'
  } else {
    return '完成'
  }
})
</script>

<style scoped>
.loading-bar {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  z-index: 100;
}

.loading-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.loading-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
}

.loading-percent {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-family: monospace;
}

.progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-fill.complete {
  background: #67c23a;
}
</style>
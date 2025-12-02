<template>
  <div class="toolbar">
    <el-button-group>
      <el-tooltip content="平移模式 (拖拽移动模型)" placement="bottom">
        <el-button 
          :type="transformMode === 'translate' ? 'primary' : ''" 
          @click="$emit('setMode', 'translate')"
        >
          <el-icon><Rank /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="旋转模式 (拖拽旋转模型)" placement="bottom">
        <el-button 
          :type="transformMode === 'rotate' ? 'primary' : ''" 
          @click="$emit('setMode', 'rotate')"
        >
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="缩放模式 (拖拽缩放模型)" placement="bottom">
        <el-button 
          :type="transformMode === 'scale' ? 'primary' : ''" 
          @click="$emit('setMode', 'scale')"
        >
          <el-icon><ZoomIn /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="复位视图" placement="bottom">
        <el-button @click="$emit('reset')">
          <el-icon><Monitor /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="isRotating ? '暂停旋转' : '播放旋转'" placement="bottom">
        <el-button @click="$emit('toggleRotate')">
          <span v-if="!isRotating">▶️</span>
          <span v-else>⏸️</span>
        </el-button>
      </el-tooltip>
    </el-button-group>
    
    <!-- 使用提示 -->
    <div class="usage-tip">
      <el-tooltip content="按住Shift键拖拽可旋转视角，拖拽变换控制器可操作模型" placement="bottom">
        <span class="tip-text">💡 拖拽变换控制器操作模型</span>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Rank, Refresh, ZoomIn, Monitor } from '@element-plus/icons-vue'
import type { TransformMode } from '../../core/types'

defineProps<{
  transformMode: TransformMode
  isRotating: boolean
}>()

defineEmits<{
  (e: 'setMode', mode: TransformMode): void
  (e: 'reset'): void
  (e: 'toggleRotate'): void
}>()
</script>

<style scoped>
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

.toolbar :deep(.el-button) {
  margin: 0 2px;
  padding: 8px 12px;
}

.toolbar :deep(.el-button i) {
  font-size: 18px;
}

.usage-tip {
  margin-left: 15px;
  display: flex;
  align-items: center;
}

.tip-text {
  font-size: 12px;
  color: #666;
  cursor: help;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .toolbar {
    top: 10px;
    padding: 3px;
  }

  .toolbar :deep(.el-button) {
    padding: 6px 10px;
  }

  .usage-tip {
    display: none;
  }
}
</style>

<template>
  <div class="control-panel">
    <div class="panel-header">
      <h3>压力数据可视化</h3>
    </div>

    <div class="panel-content">
      <!-- 颜色映射选择 -->
      <div class="control-group">
        <label>颜色映射:</label>
        <el-select v-model="localColorMap" @change="onColorMapChange" size="small">
          <el-option label="彩虹" value="rainbow" />
          <el-option label="冷暖色调" value="cooltowarm" />
          <el-option label="黑体辐射" value="blackbody" />
          <el-option label="灰度" value="grayscale" />
        </el-select>
      </div>

      <!-- 数值范围控制 -->
      <div class="control-group">
        <label>最小值:</label>
        <el-input-number 
          v-model="localMinValue" 
          @change="onRangeChange" 
          :min="0" 
          :max="localMaxValue - 1" 
          size="small" 
        />
      </div>

      <div class="control-group">
        <label>最大值:</label>
        <el-input-number 
          v-model="localMaxValue" 
          @change="onRangeChange" 
          :min="localMinValue + 1" 
          :max="5000" 
          size="small" 
        />
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
            <div 
              class="range-fill" 
              :style="{
                background: `linear-gradient(to right, ${getColorForPressure(localMinValue)}, ${getColorForPressure(localMaxValue)})`,
                width: '100%'
              }"
            ></div>
          </div>
          <div class="range-labels">
            <span class="range-min">{{ formatPressureValue(localMinValue) }}</span>
            <span class="range-max">{{ formatPressureValue(localMaxValue) }}</span>
          </div>
        </div>
      </div>

      <!-- 重置按钮 -->
      <div class="control-group">
        <el-button @click="$emit('reset')" size="small" type="primary">
          重置视图
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ColorMapType, PressureStats } from '../../core/types'

const props = defineProps<{
  colorMap: ColorMapType
  minValue: number
  maxValue: number
  pressureStats: PressureStats | null
  getColorForPressure: (pressure: number) => string
  formatPressureValue: (value: number) => string
}>()

const emit = defineEmits<{
  (e: 'update:colorMap', value: ColorMapType): void
  (e: 'update:minValue', value: number): void
  (e: 'update:maxValue', value: number): void
  (e: 'colorMapChange'): void
  (e: 'rangeChange'): void
  (e: 'reset'): void
}>()

// 本地状态
const localColorMap = ref(props.colorMap)
const localMinValue = ref(props.minValue)
const localMaxValue = ref(props.maxValue)

// 监听 props 变化
watch(() => props.colorMap, (val) => { localColorMap.value = val })
watch(() => props.minValue, (val) => { localMinValue.value = val })
watch(() => props.maxValue, (val) => { localMaxValue.value = val })

function onColorMapChange() {
  emit('update:colorMap', localColorMap.value)
  emit('colorMapChange')
}

function onRangeChange() {
  emit('update:minValue', localMinValue.value)
  emit('update:maxValue', localMaxValue.value)
  emit('rangeChange')
}
</script>

<style scoped>
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

@media (max-width: 768px) {
  .control-panel {
    width: 200px;
    top: 70px;
    left: 10px;
    padding: 12px;
    z-index: 40;
  }
}
</style>

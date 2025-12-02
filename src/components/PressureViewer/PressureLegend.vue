<template>
  <div class="pressure-legend">
    <div class="legend-title">压力值 (Pa)</div>

    <!-- 颜色条 -->
    <div class="color-bar-container">
      <div 
        class="color-bar" 
        :style="{ background: colorBarGradient }" 
        @mousemove="onColorBarHover"
        @mouseleave="hideTooltip"
      ></div>

      <!-- 数值标签 -->
      <div class="value-labels">
        <div 
          v-for="(value, index) in pressureLabels" 
          :key="index" 
          class="value-label"
          :style="{ bottom: `${(value - minValue) / (maxValue - minValue) * 100}%` }"
        >
          <span class="label-line"></span>
          <span class="label-text">{{ formatPressureValue(value) }}</span>
        </div>
      </div>

      <!-- 颜色条悬停提示 -->
      <div 
        v-if="tooltip.show" 
        class="color-bar-tooltip" 
        :style="{
          bottom: `${tooltip.position}%`,
          backgroundColor: tooltip.color
        }"
      >
        {{ formatPressureValue(tooltip.value) }} Pa
      </div>
    </div>

    <!-- 当前选中点的压力值显示 -->
    <div class="current-pressure" v-if="selectedPressure !== null">
      <div class="current-pressure-title">选中点压力:</div>
      <div class="current-pressure-value">{{ formatPressureValue(selectedPressure) }} Pa</div>
      <div 
        class="current-pressure-color" 
        :style="{ backgroundColor: getColorForPressure(selectedPressure) }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const props = defineProps<{
  colorBarGradient: string
  pressureLabels: number[]
  minValue: number
  maxValue: number
  selectedPressure: number | null
  getColorForPressure: (pressure: number) => string
  formatPressureValue: (value: number) => string
}>()

// 提示框状态
const tooltip = reactive({
  show: false,
  position: 0,
  value: 0,
  color: '#000'
})

function onColorBarHover(event: MouseEvent) {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const y = event.clientY - rect.top
  const height = rect.height
  const position = ((height - y) / height) * 100

  const value = props.minValue + (position / 100) * (props.maxValue - props.minValue)
  const color = props.getColorForPressure(value)

  tooltip.show = true
  tooltip.position = position
  tooltip.value = value
  tooltip.color = color
}

function hideTooltip() {
  tooltip.show = false
}
</script>

<style scoped>
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
  cursor: crosshair;
  transition: box-shadow 0.2s ease;
}

.color-bar:hover {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
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

@media (max-width: 768px) {
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

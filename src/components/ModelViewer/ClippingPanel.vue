<template>
  <div class="clipping-panel">
    <div class="clipping-row">
      <el-checkbox v-model="xEnabled" @change="onAxisToggle('x')">X</el-checkbox>
      <el-slider
        v-model="xValue"
        :min="0"
        :max="1"
        :step="0.01"
        :disabled="!xEnabled"
        @input="onAxisChange('x')"
      />
    </div>
    <div class="clipping-row">
      <el-checkbox v-model="yEnabled" @change="onAxisToggle('y')">Y</el-checkbox>
      <el-slider
        v-model="yValue"
        :min="0"
        :max="1"
        :step="0.01"
        :disabled="!yEnabled"
        @input="onAxisChange('y')"
      />
    </div>
    <div class="clipping-row">
      <el-checkbox v-model="zEnabled" @change="onAxisToggle('z')">Z</el-checkbox>
      <el-slider
        v-model="zValue"
        :min="0"
        :max="1"
        :step="0.01"
        :disabled="!zEnabled"
        @input="onAxisChange('z')"
      />
    </div>
    <div class="clipping-actions">
      <el-button size="small" @click="onReset">重置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'change', axis: 'x' | 'y' | 'z', enabled: boolean, value: number): void
  (e: 'reset'): void
}>()

const xEnabled = ref(false)
const yEnabled = ref(false)
const zEnabled = ref(false)

const xValue = ref(0.5)
const yValue = ref(0.5)
const zValue = ref(0.5)

function onAxisToggle(axis: 'x' | 'y' | 'z') {
  if (axis === 'x') {
    emit('change', axis, xEnabled.value, xValue.value)
  } else if (axis === 'y') {
    emit('change', axis, yEnabled.value, yValue.value)
  } else {
    emit('change', axis, zEnabled.value, zValue.value)
  }
}

function onAxisChange(axis: 'x' | 'y' | 'z') {
  if (axis === 'x') {
    emit('change', axis, xEnabled.value, xValue.value)
  } else if (axis === 'y') {
    emit('change', axis, yEnabled.value, yValue.value)
  } else {
    emit('change', axis, zEnabled.value, zValue.value)
  }
}

function onReset() {
  xEnabled.value = false
  yEnabled.value = false
  zEnabled.value = false
  xValue.value = 0.5
  yValue.value = 0.5
  zValue.value = 0.5
  emit('reset')
}
</script>

<style scoped>
.clipping-panel {
  position: absolute;
  top: 70px;
  right: 20px;
  z-index: 110;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 260px;
}

.clipping-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.clipping-row :deep(.el-slider) {
  flex: 1;
  margin-left: 8px;
}

.clipping-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}
</style>

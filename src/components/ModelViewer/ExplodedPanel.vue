<template>
  <div class="exploded-panel">
    <div class="header">爆炸视图</div>
    <el-slider
      v-model="value"
      :min="0"
      :max="1"
      :step="0.01"
      @input="onChange"
    />
    <div class="actions">
      <el-button size="small" @click="onReset">重置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'change', factor: number): void
  (e: 'reset'): void
}>()

const value = ref(0)

function onChange() {
  emit('change', value.value)
}

function onReset() {
  value.value = 0
  emit('reset')
}
</script>

<style scoped>
.exploded-panel {
  position: absolute;
  top: 70px;
  left: 20px;
  z-index: 110;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 220px;
}

.header {
  font-size: 13px;
  margin-bottom: 6px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}
</style>

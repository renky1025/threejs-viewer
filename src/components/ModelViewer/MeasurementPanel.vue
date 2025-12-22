<template>
  <div class="measurement-panel">
    <div class="header">测量</div>
    <div class="content">
      <div class="row">
        <span class="label">点 1：</span>
        <span class="value">{{ formattedPoint(0) }}</span>
      </div>
      <div class="row">
        <span class="label">点 2：</span>
        <span class="value">{{ formattedPoint(1) }}</span>
      </div>
      <div class="row distance-row">
        <span class="label">距离：</span>
        <span class="value">{{ formattedDistance }}</span>
      </div>
      <div class="actions">
        <el-button size="small" type="primary" @click="$emit('clear')">
          清除
        </el-button>
      </div>
      <div class="tip">在视图中点击两次模型表面，可测量两点间距离。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MeasureResult } from '../../core/types'

const props = defineProps<{
  result: MeasureResult | null
}>()

const formattedDistance = computed(() => {
  if (!props.result || props.result.distance == null) return '-'
  const d = props.result.distance
  if (!isFinite(d)) return '-'
  return d.toFixed(3)
})

function formattedPoint(index: number) {
  const pts = props.result?.points || []
  if (pts.length <= index) return '-'
  const p = pts[index]
  if (!p) return '-'
  const [x, y, z] = p
  return `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`
}
</script>

<style scoped>
.measurement-panel {
  position: absolute;
  top: 70px;
  right: 20px;
  z-index: 120;
  width: 260px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header {
  font-size: 13px;
  margin-bottom: 6px;
}

.content {
  font-size: 12px;
}

.row {
  display: flex;
  margin-bottom: 4px;
}

.label {
  width: 40px;
  color: #666;
}

.value {
  flex: 1;
  word-break: break-all;
}

.distance-row .value {
  font-weight: bold;
}

.actions {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
}

.tip {
  margin-top: 4px;
  color: #999;
}
</style>

<template>
  <div class="scene-graph-panel">
    <div class="header">层级管理</div>
    <el-tree
      :data="nodes"
      node-key="id"
      :props="treeProps"
      default-expand-all
    >
      <template #default="{ data }">
        <div class="node-row">
          <span class="node-name">{{ data.name }}</span>
          <el-switch
            v-model="data.visible"
            size="small"
            @change="onVisibleChange(data)"
          />
          <el-switch
            v-model="data.locked"
            size="small"
            @change="onLockChange(data)"
          />
          <el-slider
            v-model="data.opacityInternal"
            :min="0"
            :max="1"
            :step="0.05"
            class="opacity-slider"
            @input="onOpacityChange(data)"
          />
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SceneNode } from '../../core/types'

defineProps<{
  nodes: SceneNode[]
}>()

const emit = defineEmits<{
  (e: 'toggleVisible', id: string, visible: boolean): void
  (e: 'changeOpacity', id: string, opacity: number): void
  (e: 'toggleLock', id: string, locked: boolean): void
}>()

const treeProps = computed(() => ({
  children: 'children',
  label: 'name'
}))

function ensureOpacityInternal(node: any) {
  if (typeof node.opacityInternal !== 'number') {
    node.opacityInternal = typeof node.opacity === 'number' ? node.opacity : 1
  }
}

function onVisibleChange(node: any) {
  emit('toggleVisible', node.id, !!node.visible)
}

function onLockChange(node: any) {
  emit('toggleLock', node.id, !!node.locked)
}

function onOpacityChange(node: any) {
  ensureOpacityInternal(node)
  const value = typeof node.opacityInternal === 'number' ? node.opacityInternal : 1
  emit('changeOpacity', node.id, value)
}
</script>

<style scoped>
.scene-graph-panel {
  position: absolute;
  top: 70px;
  right: 20px;
  z-index: 120;
  width: 280px;
  max-height: 60vh;
  overflow: auto;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header {
  font-size: 13px;
  margin-bottom: 6px;
}

.node-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.node-name {
  flex: 1;
  font-size: 12px;
}

.opacity-slider {
  flex: 1.2;
}
</style>

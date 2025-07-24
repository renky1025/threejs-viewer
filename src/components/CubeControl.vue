<template>
  <div class="cube-control-container" ref="cube"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

// 定义组件属性
const props = defineProps<{ viewer: any }>()

// 立方体控制器容器引用
const cube = ref<HTMLDivElement>()

/**
 * 初始化立方体控制器
 */
function initCubeControl() {
  if (cube.value && props.viewer?.value) {
    props.viewer.value.addCubeControl(cube.value)
  }
}

// 组件挂载时初始化
onMounted(() => {
  initCubeControl()
})

// 监听viewer变化，重新初始化
watch(() => props.viewer?.value, () => {
  initCubeControl()
}, { deep: true })
</script>

<style scoped>
.cube-control-container {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 120px;
  height: 120px;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}
</style>
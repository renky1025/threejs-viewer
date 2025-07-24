<script setup lang="ts">
// 根组件，无需额外逻辑
</script>

<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>

<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f5f7fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .el-header {
    padding: 10px !important;
  }
  
  .el-main {
    padding: 10px !important;
  }
}
</style>

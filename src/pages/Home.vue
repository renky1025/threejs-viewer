<template>
  <el-container class="home-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1 class="app-title">3D模型查看器</h1>
        <div class="search-filters">
          <el-input 
            v-model="search" 
            placeholder="搜索模型..." 
            prefix-icon="el-icon-search"
            clearable
          />
          <el-select 
            v-model="category" 
            placeholder="分类" 
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="头盔" value="helmet" />
            <el-option label="人物" value="character" />
            <el-option label="家具" value="furniture" />
          </el-select>
        </div>
      </div>
    </el-header>
    
    <el-main class="app-main">
      <div class="main-content">
        <h2 class="section-title">模型库</h2>
        <p class="section-description">
          选择一个3D模型进行查看。支持的格式：OBJ, FBX, GLTF, GLB
        </p>
        
        <ModelList 
          :search="search" 
          :category="category" 
          @select="onSelect" 
        />
      </div>
    </el-main>
    
    <el-footer class="app-footer">
      <p>3D模型查看器 &copy; {{ currentYear }}</p>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ModelList from '@/components/ModelList.vue'
import { useRouter } from 'vue-router'
import type { Model } from '../utils/types'

// 路由
const router = useRouter()

// 搜索和过滤状态
const search = ref('')
const category = ref('')

// 当前年份
const currentYear = computed(() => new Date().getFullYear())

/**
 * 选择模型处理函数
 * @param model 选中的模型
 */
function onSelect(model: Model) {
  console.log(model.name)
  router.push({ 
    name: 'ModelPage', 
    params: { name: model.name } 
  })
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 0;
  height: auto;
}

.header-content {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.app-title {
  margin: 0;
  font-size: 24px;
  color: #409EFF;
}

.search-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-filters .el-input {
  width: 300px;
}

.search-filters .el-select {
  width: 120px;
}

.app-main {
  flex: 1;
  background-color: #f5f7fa;
  padding: 20px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
}

.section-description {
  color: #606266;
  margin-bottom: 20px;
}

.app-footer {
  background-color: #fff;
  text-align: center;
  color: #909399;
  padding: 15px 0;
  box-shadow: 0 -2px 12px 0 rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .search-filters {
    width: 100%;
  }
  
  .search-filters .el-input,
  .search-filters .el-select {
    width: 100%;
  }
}
</style>
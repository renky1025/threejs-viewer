<template>
  <el-container class="home-container">
    <el-header class="app-header" role="banner">
      <div class="header-content">
        <h1 class="app-title">3D模型查看器</h1>
        <div class="nav-menu">
          <el-button type="primary" plain @click="goToMaterialSphere">
            <el-icon><Brush /></el-icon>
            材质球展示
          </el-button>
        </div>
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
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-upload
            class="upload-button"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleUploadChange"
            :accept="supportedAccept"
          >
            <el-button type="primary" plain>上传3D文件</el-button>
          </el-upload>
        </div>
      </div>
    </el-header>
    
    <el-main class="app-main" role="main">
      <div class="main-content">
        <section class="model-section" aria-labelledby="models-heading">
          <h2 id="models-heading" class="section-title">模型库</h2>
          <p class="section-description">
            选择一个3D模型进行查看。支持的格式：OBJ, FBX, GLTF, GLB, STL, STEP, IGES
            （提示：本地上传推荐使用 GLB；GLTF/OBJ 若依赖外部纹理文件可能无法完整显示）
          </p>
        
          <ModelList
            :search="search"
            :category="category"
            @select="onSelect"
          />
        </section>
      </div>
    </el-main>
    
    <el-footer class="app-footer" role="contentinfo">
      <p>3D模型查看器 &copy; {{ currentYear }}</p>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ModelList from '@/components/ModelList.vue'
import { useRouter } from 'vue-router'
import type { Model } from '../utils/types'
import type { UploadFile, UploadFiles } from 'element-plus'
import { useModelStore } from '@/store'
import { useToast } from '@/composables/useToast'
import { Brush } from '@element-plus/icons-vue'

// 路由
const router = useRouter()
const store = useModelStore()
const { showToast } = useToast()

// 搜索和过滤状态
const search = ref('')
const category = ref('')
const supportedAccept = '.glb,.gltf,.fbx,.obj,.stl,.step,.stp,.iges,.igs'
const categoryOptions = computed(() => store.categories)

// 当前年份
const currentYear = computed(() => new Date().getFullYear())

/**
 * 选择模型处理函数
 * @param model 选中的模型
 */
function onSelect(model: Model) {
  router.push({
    name: 'ModelPage',
    params: { name: model.name }
  })
}

function goToMaterialSphere() {
  router.push({ name: 'MaterialSphere' })
}

function handleUploadChange(uploadFile: UploadFile, _: UploadFiles) {
  const raw = uploadFile.raw
  if (!raw) {
    showToast({ type: 'error', message: '文件读取失败，请重试' })
    return
  }

  const model = store.registerUploadedFile(raw)
  if (!model) {
    showToast({ type: 'warning', message: '不支持的文件格式，请上传 glb/gltf/fbx/obj/stl/step/iges' })
    return
  }

  showToast({ type: 'success', message: `文件已导入：${raw.name}` })
  onSelect(model)
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
  gap: 15px;
}

.nav-menu {
  display: flex;
  gap: 10px;
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

.upload-button {
  display: inline-flex;
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

  .upload-button {
    width: 100%;
  }

  .upload-button :deep(.el-upload),
  .upload-button :deep(.el-button) {
    width: 100%;
  }
}
</style>

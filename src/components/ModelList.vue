<template>
  <div class="model-list">
    <el-empty v-if="filteredModels.length === 0" description="没有找到匹配的模型" />
    
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="model in filteredModels" :key="model.name">
        <el-card 
          shadow="hover" 
          @click="() => $emit('select', model)" 
          class="model-card"
          :body-style="{ padding: '0px' }"
        >
          <div class="model-thumbnail">
            <img :src="model.thumbnail || '/assets/placeholder.svg'" alt="模型缩略图">
          </div>
          <div class="model-info">
            <h3>{{ model.name }}</h3>
            <el-tag size="small" :type="getTagType(model.type)">{{ model.type }}</el-tag>
            <el-tag size="small" :type="getCategoryTagType(model.category)" class="category-tag">
              {{ getCategoryName(model.category) }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useModelStore } from '../store'
import type { Model } from '../utils/types'

// 定义组件属性
const props = defineProps<{ 
  search: string, 
  category: string 
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'select', model: Model): void
}>()

// 获取模型存储
const store = useModelStore()

// 过滤模型列表
const filteredModels = computed(() => {
  return store.models.filter(m =>
    (!props.category || m.category === props.category) &&
    (!props.search || m.name.toLowerCase().includes(props.search.toLowerCase()))
  )
})

/**
 * 获取模型类型对应的标签类型
 * @param type 模型类型
 * @returns 标签类型
 */
function getTagType(type: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  switch (type) {
    case 'gltf':
      return 'success'
    case 'glb':
      return 'success'
    case 'fbx':
      return 'warning'
    case 'obj':
      return 'info'
    default:
      return ''
  }
}

/**
 * 获取分类对应的标签类型
 * @param category 分类
 * @returns 标签类型
 */
function getCategoryTagType(category: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  switch (category) {
    case 'helmet':
      return 'danger'
    case 'character':
      return 'warning'
    case 'furniture':
      return 'info'
    default:
      return ''
  }
}

/**
 * 获取分类名称
 * @param category 分类代码
 * @returns 分类名称
 */
function getCategoryName(category: string): string {
  switch (category) {
    case 'helmet':
      return '头盔'
    case 'character':
      return '人物'
    case 'furniture':
      return '家具'
    default:
      return category
  }
}
</script>

<style scoped>
.model-list {
  margin-top: 20px;
}

.model-card {
  cursor: pointer;
  transition: transform 0.3s;
  margin-bottom: 20px;
  overflow: hidden;
}

.model-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.model-thumbnail {
  height: 150px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.model-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.model-card:hover .model-thumbnail img {
  transform: scale(1.05);
}

.model-info {
  padding: 14px;
}

.model-info h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-tag {
  margin-left: 5px;
}
</style>
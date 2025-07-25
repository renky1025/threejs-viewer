import { defineStore } from 'pinia'
import type { Model } from '../utils/types'

/**
 * 模型存储
 */
export const useModelStore = defineStore('model', {
  state: () => ({
    models: [
      { 
        name: 'DamagedHelmet', 
        type: 'gltf', 
        file: '/models/DamagedHelmet.gltf', 
        category: 'helmet',
        thumbnail: '/assets/thumbnails/webgl_loader_gltf.jpg'
      },
      { 
        name: 'Samba Dancing', 
        type: 'fbx', 
        file: '/models/Samba Dancing.fbx', 
        category: 'character',
        thumbnail: '/assets/thumbnails/webgl_loader_fbx.jpg'
      },
      { 
        name: 'male02', 
        type: 'obj', 
        file: '/models/male02.obj', 
        category: 'character',
        thumbnail: '/assets/thumbnails/webgl_loader_obj.jpg'
      },
      { 
        name: 'SheenChair', 
        type: 'glb', 
        file: '/models/SheenChair.glb', 
        category: 'furniture',
        thumbnail: '/assets/thumbnails/webgl_loader_gltf_sheen.jpg'
      },
      { 
        name: 'pressure', 
        type: 'json', 
        file: '/models/pressure.json', 
        category: 'data',
        thumbnail: '/assets/thumbnails/webgl_geometry_colors_lookuptable.jpg'
      },
      {
        name: 'pr2', 
        type: 'stl', 
        file: '/models/colored.stl', 
        category: 'data',
        thumbnail: '/assets/thumbnails/webgl_loader_stl.jpg'
      }
    ] as Model[]
  }),
  
  getters: {
    /**
     * 按分类获取模型
     * @param state 状态
     * @returns 过滤函数
     */
    getByCategory: (state) => (cat: string) => 
      state.models.filter(m => m.category === cat),
      
    /**
     * 按类型获取模型
     * @param state 状态
     * @returns 过滤函数
     */
    getByType: (state) => (type: string) => 
      state.models.filter(m => m.type === type)
  },
  
  actions: {
    /**
     * 按名称查找模型
     * @param name 模型名称
     * @returns 模型对象或undefined
     */
    findByName(name: string): Model | undefined {
      return this.models.find(m => m.name === name)
    }
  }
})
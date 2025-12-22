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
        name: '9836-koenigsegg-agera', 
        type: 'obj', 
        file: '/models/9836-koenigsegg-agera.obj', 
        category: 'character',
        thumbnail: '/assets/thumbnails/9836-koenigsegg-agera.jpg'
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
        category: '压力数据',
        thumbnail: '/assets/thumbnails/webgl_geometry_colors_lookuptable.jpg'
      },
      {
        name: 'pr2', 
        type: 'stl', 
        file: '/models/colored.stl', 
        category: '零件',
        thumbnail: '/assets/thumbnails/webgl_loader_stl.jpg'
      },{
        name: 'Rescue Robot 2 HKAMEL',
        type: 'step',
        file: '/models/Rescue Robot 2 HKAMEL.STEP',
        category: '机器',
        thumbnail: '/assets/thumbnails/l2992-rescue-robot-83431.jpg'
      },{
        name: 'Oillamp',
        type: 'iges',
        file: '/models/Oillamp.igs',
        category: '灯',
        thumbnail: '/assets/thumbnails/oillamp400x400_full.jpg'
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
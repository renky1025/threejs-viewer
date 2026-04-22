import { defineStore } from 'pinia'
import type { Model } from '../utils/types'
import { buildUploadedModel } from '@/utils/modelSource'

const categoryNameMap: Record<string, string> = {
  helmet: '头盔',
  character: '人物',
  furniture: '家具',
  car: '汽车',
  data: '数据',
  '压力数据': '压力数据',
  '零件': '零件',
  '机器': '机器',
  '灯': '灯',
  home: '家居',
  remote: '远程模型',
  uploaded: '本地上传'
}

/**
 * 模型存储
 */
export const useModelStore = defineStore('model', {
  state: () => ({
    uploadedModelFiles: {} as Record<string, string>,
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
      },
      {
        name: '兵马俑懒人沙发躺平',
        type: 'obj',
        file: '/home/兵马俑懒人沙发躺平/model.obj',
        category: 'home',
        thumbnail: '/home/兵马俑懒人沙发躺平/image.jpg'
      },
      {
        name: '单人凳子',
        type: 'obj',
        file: '/home/单人凳子/model.obj',
        category: 'home',
        thumbnail: '/home/单人凳子/image.jpg'
      },
      {
        name: '懒人沙发S-0',
        type: 'obj',
        file: '/home/懒人沙发S-0/model.obj',
        category: 'home',
        thumbnail: '/home/懒人沙发S-0/image.jpg'
      },
      {
        name: '懒人沙发S-1',
        type: 'obj',
        file: '/home/懒人沙发S-1/model.obj',
        category: 'home',
        thumbnail: '/home/懒人沙发S-1/image.jpg'
      },
      {
        name: '柜子',
        type: 'obj',
        file: '/home/柜子/model.obj',
        category: 'home',
        thumbnail: '/home/柜子/image.jpg'
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
      state.models.filter(m => m.type === type),
    categories: (state) =>
      Array.from(new Set(state.models.map((model) => model.category))).map((category) => ({
        value: category,
        label: categoryNameMap[category] || category
      }))
  },
  
  actions: {
    /**
     * 按名称查找模型
     * @param name 模型名称
     * @returns 模型对象或undefined
     */
    findByName(name: string): Model | undefined {
      return this.models.find(m => m.name === name)
    },
    registerUploadedFile(file: File): Model | null {
      const model = buildUploadedModel(file)
      if (!model) return null

      const oldFile = this.uploadedModelFiles[model.name]
      if (oldFile && oldFile !== model.file) {
        URL.revokeObjectURL(oldFile)
      }

      this.uploadedModelFiles[model.name] = model.file
      this.models.unshift(model)
      return model
    },
    clearUploadedModels(): void {
      Object.values(this.uploadedModelFiles).forEach((url) => URL.revokeObjectURL(url))
      this.uploadedModelFiles = {}
      this.models = this.models.filter((model) => model.source !== 'uploaded')
    }
  }
})

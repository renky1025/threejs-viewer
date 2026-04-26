import { create } from 'zustand'
import type { Model } from '../utils/types'
import { buildUploadedModel } from '../utils/modelSource'

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

interface ModelState {
  uploadedModelFiles: Record<string, string>;
  models: Model[];
  categories: { value: string, label: string }[];
  getByCategory: (cat: string) => Model[];
  getByType: (type: string) => Model[];
  findByName: (name: string) => Model | undefined;
  registerUploadedFile: (file: File) => Model | null;
  clearUploadedModels: () => void;
}

const initialModels: Model[] = [
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
]

export const useModelStore = create<ModelState>((set, get) => ({
  uploadedModelFiles: {},
  models: initialModels,
  categories: Array.from(new Set(initialModels.map((model) => model.category))).map((category) => ({
    value: category,
    label: categoryNameMap[category] || category
  })),

  getByCategory: (cat: string) => get().models.filter(m => m.category === cat),
  
  getByType: (type: string) => get().models.filter(m => m.type === type),
  
  findByName: (name: string) => get().models.find(m => m.name === name),
  
  registerUploadedFile: (file: File) => {
    const model = buildUploadedModel(file)
    if (!model) return null

    const { uploadedModelFiles, models } = get()
    const oldFile = uploadedModelFiles[model.name]
    if (oldFile && oldFile !== model.file) {
      URL.revokeObjectURL(oldFile)
    }

    const newUploadedFiles = { ...uploadedModelFiles, [model.name]: model.file }
    const newModels = [model, ...models]
    
    set({
      uploadedModelFiles: newUploadedFiles,
      models: newModels,
      categories: Array.from(new Set(newModels.map((m) => m.category))).map((category) => ({
        value: category,
        label: categoryNameMap[category] || category
      }))
    })
    
    return model
  },
  
  clearUploadedModels: () => {
    const { uploadedModelFiles, models } = get()
    Object.values(uploadedModelFiles).forEach((url) => URL.revokeObjectURL(url))
    
    const newModels = models.filter((model) => model.source !== 'uploaded')
    set({
      uploadedModelFiles: {},
      models: newModels,
      categories: Array.from(new Set(newModels.map((m) => m.category))).map((category) => ({
        value: category,
        label: categoryNameMap[category] || category
      }))
    })
  }
}))

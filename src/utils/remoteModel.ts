import type { Model, ModelType } from './types'

function getExtension(url: string | undefined | null): string | null {
  if (!url) return null
  const partsAfterHash = url.split('#')
  const hashPart = partsAfterHash[0] ?? ''
  const partsAfterQuery = hashPart.split('?')
  const clean = partsAfterQuery[0] ?? ''
  if (!clean) return null
  const idx = clean.lastIndexOf('.')
  if (idx === -1) return null
  return clean.slice(idx + 1).toLowerCase()
}

function resolveModelType(src: string, explicitType?: string): ModelType | null {
  const type = (explicitType || '').toLowerCase()

  const map: Record<string, ModelType> = {
    glb: 'glb',
    gltf: 'gltf',
    fbx: 'fbx',
    obj: 'obj',
    stl: 'stl',
    step: 'step',
    stp: 'step',
    iges: 'iges',
    igs: 'iges'
  }

  if (type && map[type]) {
    return map[type]
  }

  const ext = getExtension(src)
  if (!ext) return null

  return map[ext] || null
}

/**
 * 根据路由查询参数构建远程模型描述
 * 仅负责拼出 Model，不负责预下载/缓存
 */
export function buildRemoteModelFromQuery(query: Record<string, any>): Model | null {
  const src = typeof query.src === 'string' ? query.src : ''
  if (!src) return null

  const explicitType = typeof query.type === 'string' ? query.type : undefined
  const modelType = resolveModelType(src, explicitType)
  if (!modelType) return null

  const name = (typeof query.name === 'string' && query.name.trim())
    ? query.name.trim()
    : 'Remote Model'

  return {
    name,
    type: modelType,
    file: src,
    category: 'remote',
    thumbnail: undefined,
    source: 'remote',
    zipEntry: typeof query.zipEntry === 'string' ? query.zipEntry : undefined
  }
}

import type { Model } from './types'
import { resolveModelType } from './modelSource'

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

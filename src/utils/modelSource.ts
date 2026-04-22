import type { Model, ModelType } from '@/core/types'

const extensionTypeMap: Record<string, ModelType> = {
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

function safeDecodeURIComponent(input: string): string {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

export function getFileExtension(path: string | undefined | null): string | null {
  if (!path) return null
  const noHash = path.split('#')[0] ?? ''
  const noQuery = noHash.split('?')[0] ?? ''
  if (!noQuery) return null
  const index = noQuery.lastIndexOf('.')
  if (index === -1) return null
  return noQuery.slice(index + 1).toLowerCase()
}

export function resolveModelType(src: string, explicitType?: string): ModelType | null {
  const type = (explicitType || '').toLowerCase()
  if (type && extensionTypeMap[type]) {
    return extensionTypeMap[type]
  }

  const ext = getFileExtension(src)
  if (!ext) return null

  return extensionTypeMap[ext] || null
}

export function getNameWithoutExtension(filename: string): string {
  const decoded = safeDecodeURIComponent(filename)
  const dotIndex = decoded.lastIndexOf('.')
  if (dotIndex <= 0) return decoded
  return decoded.slice(0, dotIndex)
}

export function buildUploadedModel(file: File): Model | null {
  const type = resolveModelType(file.name)
  if (!type) return null

  const blobUrl = URL.createObjectURL(file)
  const baseName = getNameWithoutExtension(file.name) || 'Uploaded Model'
  const uniqueName = `${baseName}__uploaded_${Date.now()}`

  return {
    name: uniqueName,
    type,
    file: blobUrl,
    category: 'uploaded',
    source: 'uploaded'
  }
}

import JSZip from 'jszip'
import type { JSZipObject } from 'jszip'
import type { Model } from '../types'
import { getModelData, setModelData, touchModel } from './ModelCache'

interface PreparedModelResult {
  model: Model
  blobUrl?: string
}

function buildCacheKey(file: string, zipEntry?: string): string {
  const entry = zipEntry ?? ''
  return `${file}::${entry}`
}

async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch remote model: ${response.status}`)
  }
  return await response.arrayBuffer()
}

export async function prepareRemoteModel(model: Model): Promise<PreparedModelResult> {
  const isZip = model.file.toLowerCase().includes('.zip')
  const cacheKey = buildCacheKey(model.file, isZip ? undefined : model.zipEntry)

  if (!isZip) {
    let data = await getModelData(cacheKey)
    if (!data) {
      data = await fetchBinary(model.file)
      await setModelData(cacheKey, data)
    } else {
      await touchModel(cacheKey)
    }

    const blob = new Blob([data])
    const url = URL.createObjectURL(blob)
    return {
      model: { ...model, file: url, source: model.source ?? 'remote' },
      blobUrl: url
    }
  }

  // zip 场景：优先缓存 zip 原始数据
  const zipKey = buildCacheKey(model.file)
  let zipData = await getModelData(zipKey)
  if (!zipData) {
    zipData = await fetchBinary(model.file)
    await setModelData(zipKey, zipData)
  } else {
    await touchModel(zipKey)
  }

  const zip = await JSZip.loadAsync(zipData)

  let entryPath = model.zipEntry
  if (!entryPath) {
    const candidates = Object.keys(zip.files).filter((name) =>
      /\.(glb|gltf|fbx|obj|stl|step|stp|iges|igs)$/i.test(name)
    )
    if (!candidates.length) {
      throw new Error('No supported model file found in zip package')
    }
    entryPath = candidates[0]
  }

  const finalEntryPath: string = entryPath as string
  const zipEntry: JSZipObject | null = zip.file(finalEntryPath)
  if (!zipEntry) {
    throw new Error(`Zip entry not found: ${finalEntryPath}`)
  }

  const innerData = await zipEntry.async('arraybuffer')
  const blob = new Blob([innerData])
  const url = URL.createObjectURL(blob)

  return {
    model: { ...model, file: url, source: model.source ?? 'remote' },
    blobUrl: url
  }
}

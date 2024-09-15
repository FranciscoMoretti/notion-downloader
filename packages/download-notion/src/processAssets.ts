import { NotionObjectTree } from "notion-downloader"

import { FilesManager } from "./files/FilesManager"
import { FilesMap } from "./files/FilesMap"
import { readFile, saveFileBuffer } from "./notionObjects/fileBufferUtils"
import {
  NotionImageLike,
  iNotionAssetObject,
} from "./notionObjects/objectTypes"
import { applyToAllAssets } from "./objectTree/applyToAssets"
import { FileBuffersMemory } from "./types"

export async function readOrDownloadNewAssets(
  objectsTree: NotionObjectTree,
  assetsCacheFilesMap: FilesMap | undefined,
  existingFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory
) {
  await applyToAllAssets({
    objectsTree,
    applyToAsset: async (asset) => {
      if (existingFilesManager.isObjectNew(asset)) {
        await readOrDownloadImage(asset, assetsCacheFilesMap, filesInMemory)
      }
    },
  })
}

export async function updateAssetFilePathsForMarkdown(
  objectsTree: NotionObjectTree,
  newFilesManager: FilesManager
) {
  await applyToAllAssets({
    objectsTree,
    applyToAsset: async (asset) => {
      await updateAssetForMarkdown(asset, newFilesManager)
    },
  })
}

export async function saveNewAssets(
  objectsTree: NotionObjectTree,
  existingFilesManager: FilesManager,
  newFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory
) {
  await applyToAllAssets({
    objectsTree,
    applyToAsset: async (asset) => {
      if (existingFilesManager.isObjectNew(asset)) {
        await saveAsset(asset, newFilesManager, filesInMemory)
      }
    },
  })
}

export async function readOrDownloadImage(
  asset: iNotionAssetObject,
  assetsCacheFilesMap: FilesMap | undefined,
  filesInMemory: FileBuffersMemory
) {
  if (assetsCacheFilesMap) {
    const cachedAsset = assetsCacheFilesMap.get(asset.assetType, asset.id)
    filesInMemory[asset.id] = await readFile(cachedAsset.path, "file")
  } else {
    filesInMemory[asset.id] = await readFile(asset.url, "url")
  }
}

export async function updateAssetForMarkdown(
  asset: iNotionAssetObject,
  newFilesManager: FilesManager
) {
  const markdownPath = newFilesManager.get(
    "markdown",
    asset.assetType,
    asset.id
  ).path
  asset.setUrl(markdownPath)
}

export async function saveAsset(
  asset: iNotionAssetObject,
  newFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory
) {
  const assetFileOutputPath = newFilesManager.get(
    "output",
    asset.assetType,
    asset.id
  ).path

  const fileBuffer = filesInMemory[asset.id]
  if (!fileBuffer) {
    throw new Error(`File buffer not found for ${asset.id}`)
  }
  await saveFileBuffer(fileBuffer, assetFileOutputPath)
}

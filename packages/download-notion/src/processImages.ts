import { NotionObjectTree } from "notion-downloader"

import { FilesManager } from "./files/FilesManager"
import { FilesMap } from "./files/FilesMap"
import { NotionFile } from "./notionObjects/NotionFile"
import { readFile, saveFileBuffer } from "./notionObjects/fileBufferUtils"
import {
  NotionImageLike,
  iNotionAssetObject,
} from "./notionObjects/objectTypes"
import { applyToAllAssets } from "./objectTree/applyToAssets"
import { FileBuffersMemory } from "./types"

export async function readOrDownloadNewImages(
  objectsTree: NotionObjectTree,
  assetsCacheFilesMap: FilesMap | undefined,
  existingFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory
) {
  await applyToAllAssets({
    objectsTree,
    applyToAsset: async (image) => {
      if (existingFilesManager.isObjectNew(image)) {
        await readOrDownloadImage(image, assetsCacheFilesMap, filesInMemory)
      }
    },
  })
}

export async function updateImageFilePathsForMarkdown(
  objectsTree: NotionObjectTree,
  newFilesManager: FilesManager
) {
  await applyToAllAssets({
    objectsTree,
    applyToAsset: async (asset) => {
      await updateImageForMarkdown(asset, newFilesManager)
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
        await saveImage(asset, newFilesManager, filesInMemory)
      }
    },
  })
}

export async function readOrDownloadImage(
  image: iNotionAssetObject,
  assetsCacheFilesMap: FilesMap | undefined,
  filesInMemory: FileBuffersMemory
) {
  if (assetsCacheFilesMap) {
    const cachedImage = assetsCacheFilesMap.get("image", image.id)
    filesInMemory[image.id] = await readFile(cachedImage.path, "file")
  } else {
    filesInMemory[image.id] = await readFile(image.url, "url")
  }
}

export async function updateImageForMarkdown(
  image: iNotionAssetObject,
  newFilesManager: FilesManager
) {
  const markdownPath = newFilesManager.get("markdown", "image", image.id).path
  image.setUrl(markdownPath)
}

export async function saveImage(
  asset: iNotionAssetObject,
  newFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory
) {
  const imageFileOutputPath = newFilesManager.get(
    "output",
    "image",
    asset.id
  ).path

  // TODO: This should be handled by a NotionFile class
  const fileBuffer = filesInMemory[asset.id]
  if (!fileBuffer) {
    throw new Error(`File buffer not found for ${asset.id}`)
  }
  await saveFileBuffer(fileBuffer, imageFileOutputPath)
}

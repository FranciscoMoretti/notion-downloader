import { NotionObjectTree } from "notion-downloader"

import { FilesManager } from "./files/FilesManager"
import { FilesMap } from "./files/FilesMap"
import { readFile, saveFileBuffer } from "./notionObjects/fileBufferUtils"
import { NotionImageLike } from "./notionObjects/objectTypes"
import { applyToAllImages } from "./objectTree/applyToImages"
import { FileBuffersMemory } from "./types"

export async function readOrDownloadNewImages(
  objectsTree: NotionObjectTree,
  imagesCacheFilesMap: FilesMap | undefined,
  existingFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory
) {
  await applyToAllImages({
    objectsTree,
    applyToImage: async (image) => {
      if (existingFilesManager.isObjectNew(image)) {
        await readOrDownloadImage(image, imagesCacheFilesMap, filesInMemory)
      }
    },
  })
}

export async function updateImageFilePathsForMarkdown(
  objectsTree: NotionObjectTree,
  newFilesManager: FilesManager
) {
  await applyToAllImages({
    objectsTree,
    applyToImage: async (image) => {
      await updateImageForMarkdown(image, newFilesManager)
    },
  })
}

export async function saveNewAssets(
  objectsTree: NotionObjectTree,
  existingFilesManager: FilesManager,
  newFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory
) {
  await applyToAllImages({
    objectsTree,
    applyToImage: async (image) => {
      if (existingFilesManager.isObjectNew(image)) {
        await saveImage(image, newFilesManager, filesInMemory)
      }
    },
  })
}

export async function readOrDownloadImage(
  image: NotionImageLike,
  imagesCacheFilesMap: FilesMap | undefined,
  filesInMemory: FileBuffersMemory
) {
  if (imagesCacheFilesMap) {
    const cachedImage = imagesCacheFilesMap.get("image", image.id)
    filesInMemory[image.id] = await readFile(cachedImage.path, "file")
  } else {
    filesInMemory[image.id] = await readFile(image.url, "url")
  }
}

export async function updateImageForMarkdown(
  image: NotionImageLike,
  newFilesManager: FilesManager
) {
  const markdownPath = newFilesManager.get("markdown", "image", image.id).path
  image.setUrl(markdownPath)
}

export async function saveImage(
  image: NotionImageLike,
  newFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory
) {
  const imageFileOutputPath = newFilesManager.get(
    "output",
    "image",
    image.id
  ).path

  // TODO: This should be handled by a NotionFile class
  const fileBuffer = filesInMemory[image.id]
  if (!fileBuffer) {
    throw new Error(`File buffer not found for ${image.id}`)
  }
  await saveFileBuffer(fileBuffer, imageFileOutputPath)
}

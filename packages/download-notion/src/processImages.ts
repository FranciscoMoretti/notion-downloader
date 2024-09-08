import { NotionObjectTree } from "notion-downloader"

import { FilesManager } from "./files/FilesManager"
import { FilesMap } from "./files/FilesMap"
import { NotionBlockImage } from "./notionObjects/NotionBlockImage"
import { NotionCoverImage } from "./notionObjects/NotionCoverImage"
import { readFile, saveFileBuffer } from "./notionObjects/fileBufferUtils"
import { NotionImageLike } from "./notionObjects/objectTypes"
import { databaseHasCover, pageHasCover } from "./notionObjects/objectutils"
import { FileBuffersMemory } from "./types"

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

export async function applyToAllImages({
  objectsTree,
  applyToImage,
}: {
  objectsTree: NotionObjectTree
  applyToImage: (image: NotionImageLike) => Promise<void>
}) {
  const promises: Promise<void>[] = []

  promises.push(
    ...objectsTree.getBlocks("image").map((block) => {
      const image = new NotionBlockImage(block)
      return applyToImage(image)
    })
  )

  promises.push(
    ...objectsTree
      .getPages()
      .filter(pageHasCover)
      .map((pageResponse) => {
        const image = new NotionCoverImage(pageResponse)
        return applyToImage(image)
      })
  )

  promises.push(
    ...objectsTree
      .getDatabases()
      .filter(databaseHasCover)
      .map((databaseResponse) => {
        const image = new NotionCoverImage(databaseResponse)
        return applyToImage(image)
      })
  )

  await Promise.all(promises)
}

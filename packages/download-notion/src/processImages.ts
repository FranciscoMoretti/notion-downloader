import {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionObjectTree } from "notion-downloader"

import { FilesManager, copyRecord } from "./FilesManager"
import { FilesMap } from "./FilesMap"
import { NotionBlockImage } from "./NotionBlockImage"
import {
  DatabaseObjectResponseWithCover,
  NotionCoverImage,
  PageObjectResponseWithCover,
} from "./NotionCoverImage"
import {
  FileBuffer,
  readFile,
  saveFileBuffer,
  updateImageUrlToMarkdownImagePath,
} from "./imagesUtils"
import { NamingStrategy } from "./namingStrategy/NamingStrategy"
import { NotionImageLike } from "./objectTypes"

export async function readAndUpdateMetadata({
  image,
  existingFilesManager,
  newFilesManager,
  imageNamingStrategy,
  imagesCacheFilesMap,
  filesInMemory,
}: {
  image: NotionImageLike
  existingFilesManager: FilesManager
  newFilesManager: FilesManager
  imageNamingStrategy: NamingStrategy
  imagesCacheFilesMap: FilesMap | undefined
  filesInMemory: FileBuffersMemory
}) {
  if (existingFilesManager.isObjectNew(image)) {
    await readOrDownloadImage(image, imagesCacheFilesMap, filesInMemory)
  }
  await buildPathAndUpdateMarkdown(
    image,
    existingFilesManager,
    newFilesManager,
    imageNamingStrategy,
    filesInMemory
  )
  if (existingFilesManager.isObjectNew(image)) {
    await saveImage(image, newFilesManager, filesInMemory)
  }
}

export type FileBuffersMemory = Record<string, FileBuffer>

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

export async function buildPathAndUpdateMarkdown(
  image: NotionImageLike,
  existingFilesManager: FilesManager,
  newFilesManager: FilesManager,
  imageNamingStrategy: NamingStrategy,
  filesInMemory: FileBuffersMemory
) {
  if (existingFilesManager.isObjectNew(image)) {
    const fileBuffer = filesInMemory[image.id]
    if (!fileBuffer) {
      throw new Error(`File buffer not found for asset ${image.id}`)
    }
    image.setFileBuffer(fileBuffer)

    const imageFilename = imageNamingStrategy.getFilename(image)
    newFilesManager.set("base", "image", image.id, {
      path: imageFilename,
      lastEditedTime: image.lastEditedTime,
    })

    const markdownPath = newFilesManager.get("markdown", "image", image.id).path
    updateImageUrlToMarkdownImagePath(image, markdownPath)
  } else {
    copyRecord(existingFilesManager, newFilesManager, "image", image.id)
    const imageRecordFromDirectory = newFilesManager.get(
      "markdown",
      "image",
      image.id
    )
    updateImageUrlToMarkdownImagePath(image, imageRecordFromDirectory.path)
  }
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

function pageHasCover(
  metadata: PageObjectResponse
): metadata is PageObjectResponseWithCover {
  return Boolean(metadata.cover)
}
function databaseHasCover(
  metadata: DatabaseObjectResponse
): metadata is DatabaseObjectResponseWithCover {
  return Boolean(metadata.cover)
}

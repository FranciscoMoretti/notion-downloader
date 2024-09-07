import {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionObjectTree } from "notion-downloader"

import { FilesManager, copyRecord } from "./FilesManager"
import { FilesMap } from "./FilesMap"
import {
  DatabaseObjectResponseWithCover,
  NotionImage,
  PageObjectResponseWithCover,
} from "./NotionImage"
import { updateImageUrlToMarkdownImagePath } from "./imagesUtils"
import { NamingStrategy } from "./namingStrategy/NamingStrategy"

export async function readAndUpdateMetadata({
  image,
  existingFilesManager,
  newFilesManager,
  imageNamingStrategy,
  imagesCacheFilesMap,
}: {
  image: NotionImage
  existingFilesManager: FilesManager
  newFilesManager: FilesManager
  imageNamingStrategy: NamingStrategy
  imagesCacheFilesMap: FilesMap | undefined
}) {
  if (existingFilesManager.isObjectNew(image)) {
    if (imagesCacheFilesMap) {
      const cachedImage = imagesCacheFilesMap.get("image", image.id)
      await image.readFromFile(cachedImage.path)
    } else {
      await image.download()
    }
    // TODO: Write here a layout naming strategy for images. Name is ok, but path is not.
    const imageFilename = imageNamingStrategy.getFilename(image)
    newFilesManager.set("base", "image", image.id, {
      path: imageFilename,
      lastEditedTime: image.lastEditedTime,
    })

    const imageFileOutputPath = newFilesManager.get(
      "output",
      "image",
      image.id
    ).path

    await image.save(imageFileOutputPath)
    const markdownPath = newFilesManager.get("markdown", "image", image.id).path
    updateImageUrlToMarkdownImagePath(image.file, markdownPath)
  } else {
    copyRecord(existingFilesManager, newFilesManager, "image", image.id)
    const imageRecordFromDirectory = newFilesManager.get(
      "markdown",
      "image",
      image.id
    )
    updateImageUrlToMarkdownImagePath(image.file, imageRecordFromDirectory.path)
  }
}

export async function applyToAllImages({
  objectsTree,
  applyToImage,
}: {
  objectsTree: NotionObjectTree
  applyToImage: (image: NotionImage) => Promise<void>
}) {
  const promises: Promise<void>[] = []

  promises.push(
    ...objectsTree.getBlocks("image").map((block) => {
      const image = new NotionImage(block)
      return applyToImage(image)
    })
  )

  promises.push(
    ...objectsTree
      .getPages()
      .filter(pageHasCover)
      .map((pageResponse) => {
        const image = new NotionImage(pageResponse)
        return applyToImage(image)
      })
  )

  promises.push(
    ...objectsTree
      .getDatabases()
      .filter(databaseHasCover)
      .map((databaseResponse) => {
        const image = new NotionImage(databaseResponse)
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

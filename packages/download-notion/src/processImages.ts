import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionObjectTree } from "notion-downloader"

import { FilesManager, copyRecord } from "./FilesManager"
import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionDatabase } from "./NotionDatabase"
import {
  DatabaseObjectResponseWithCover,
  NotionImage,
  PageObjectResponseWithCover,
} from "./NotionImage"
import { NotionPage } from "./NotionPage"
import { updateImageUrlToMarkdownImagePath } from "./imagesUtils"

export async function downloadAndUpdateMetadata({
  image,
  existingFilesManager,
  newFilesManager,
  imageNamingStrategy,
}: {
  image: NotionImage
  existingFilesManager: FilesManager
  newFilesManager: FilesManager
  imageNamingStrategy: ImageNamingStrategy
}) {
  if (existingFilesManager.isObjectNew(image)) {
    await image.read()
    // TODO: Write here a layout naming strategy for images. Name is ok, but path is not.
    const imageFilename = imageNamingStrategy.getFileName(image)
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
  // Process image blocks
  for (const block of objectsTree.getBlocks("image")) {
    const image = new NotionImage(block)
    await applyToImage(image)
  }

  const pagesResponsesWithCover = objectsTree.getPages().filter(pageHasCover)
  for (const pageResponse of pagesResponsesWithCover) {
    const image = new NotionImage(pageResponse)
    await applyToImage(image)
  }

  const databasesResponsesWithCover = objectsTree
    .getDatabases()
    .filter(databaseHasCover)
  for (const databaseResponse of databasesResponsesWithCover) {
    const image = new NotionImage(databaseResponse)
    await applyToImage(image)
  }
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

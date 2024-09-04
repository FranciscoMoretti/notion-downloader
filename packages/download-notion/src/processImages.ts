import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

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

async function processImage({
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

export async function processImages({
  imageBlocks,
  existingFilesManager,
  newFilesManager,
  imageNamingStrategy,
  pages,
  databases,
}: {
  existingFilesManager: FilesManager
  newFilesManager: FilesManager
  imageNamingStrategy: ImageNamingStrategy
  imageBlocks: (BlockObjectResponse & { type: "image" })[]
  pages: NotionPage[]
  databases: NotionDatabase[]
}) {
  // Process image blocks
  for (const block of imageBlocks) {
    const image = new NotionImage(block)
    await processImage({
      image,
      existingFilesManager,
      newFilesManager,
      imageNamingStrategy,
    })
  }

  const pagesResponsesWithCover: PageObjectResponseWithCover[] = pages
    .map((page) => page.metadata)
    .filter(pageHasCover)
  for (const pageResponse of pagesResponsesWithCover) {
    const image = new NotionImage(pageResponse)
    await processImage({
      image,
      existingFilesManager,
      newFilesManager,
      imageNamingStrategy,
    })
  }

  const databasesResponsesWithCover: DatabaseObjectResponseWithCover[] =
    databases.map((database) => database.metadata).filter(databaseHasCover)
  for (const databaseResponse of databasesResponsesWithCover) {
    const image = new NotionImage(databaseResponse)
    await processImage({
      image,
      existingFilesManager,
      newFilesManager,
      imageNamingStrategy,
    })
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

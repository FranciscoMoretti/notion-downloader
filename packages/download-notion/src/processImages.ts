import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

import { FilesManager } from "./FilesManager"
import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionDatabase } from "./NotionDatabase"
import {
  DatabaseObjectResponseWithCover,
  NotionImage,
  PageObjectResponseWithCover,
} from "./NotionImage"
import { NotionPage } from "./NotionPage"
import { PathStrategy } from "./PathStrategy"
import { NotionPullOptions } from "./config/schema"
import { updateImageUrlToMarkdownImagePath } from "./images"
import { removePathPrefix } from "./pathUtils"

async function processImage({
  image,
  existingFilesManager,
  newFilesManager,
  imageNamingStrategy,
  imageFilePathStrategy,
  imageMarkdownPathStrategy,
  options,
}: {
  image: NotionImage
  existingFilesManager: FilesManager
  newFilesManager: FilesManager
  imageNamingStrategy: ImageNamingStrategy
  // TODO: The ones below should be replaced by filesmanager
  imageFilePathStrategy: PathStrategy
  imageMarkdownPathStrategy: PathStrategy
  options: NotionPullOptions
}) {
  if (existingFilesManager.shouldProcessObject(image)) {
    await image.read()
    const imageFilename = imageNamingStrategy.getFileName(image)

    // TODO: These paths strategies should be handled inside FilesManager getting the root path
    const imageFileOutputPath = imageFilePathStrategy.getPath(imageFilename)

    await image.save(imageFileOutputPath)

    const pathFromImageDirectory = removePathPrefix(
      imageFileOutputPath,
      options.imgOutputPath
    )
    newFilesManager.set("directory", "image", image.id, {
      path: pathFromImageDirectory,
      lastEditedTime: image.lastEditedTime,
    })
    return imageMarkdownPathStrategy.getPath(imageFilename)
  } else {
    const imageRecordFromDirectory = existingFilesManager.get(
      "directory",
      "image",
      image.id
    )
    newFilesManager.set(
      "directory",
      "image",
      image.id,
      imageRecordFromDirectory
    )
    updateImageUrlToMarkdownImagePath(image.file, imageRecordFromDirectory.path)
  }
}

export async function processImages({
  imageBlocks,
  existingFilesManager,
  newFilesManager,
  imageNamingStrategy,
  imageFilePathStrategy,
  options,
  imageMarkdownPathStrategy,
  pages,
  databases,
}: {
  options: NotionPullOptions
  existingFilesManager: FilesManager
  newFilesManager: FilesManager
  imageNamingStrategy: ImageNamingStrategy
  imageFilePathStrategy: PathStrategy
  imageMarkdownPathStrategy: PathStrategy
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
      imageFilePathStrategy,
      imageMarkdownPathStrategy,
      options,
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
      imageFilePathStrategy,
      imageMarkdownPathStrategy,
      options,
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
      imageFilePathStrategy,
      imageMarkdownPathStrategy,
      options,
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

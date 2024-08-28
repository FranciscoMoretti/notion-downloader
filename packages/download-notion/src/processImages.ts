import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"

import { FilesManager } from "./FilesManager"
import { FilesMap } from "./FilesMap"
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

async function processImage(
  image: NotionImage,
  filesManager: FilesManager,
  imageNamingStrategy: ImageNamingStrategy,
  imageFilePathStrategy: PathStrategy,
  imageMarkdownPathStrategy: PathStrategy,
  options: NotionPullOptions,
  filesMap: FilesMap
) {
  if (filesManager.shouldProcessObject(image)) {
    await image.read()
    const imageFilename = imageNamingStrategy.getFileName(image)

    // TODO: Include layout strategy to get a potential layout from filename before adding prefix
    const imageFileOutputPath = imageFilePathStrategy.getPath(imageFilename)

    // TODO: All saves could be done in parallel
    await image.save(imageFileOutputPath)

    // TODO: This should be handled by FilesManager
    const pathFromImageDirectory = removePathPrefix(
      imageFileOutputPath,
      options.imgOutputPath
    )
    filesMap.set("image", image.id, {
      path: pathFromImageDirectory,
      lastEditedTime: image.lastEditedTime,
    })
    return imageMarkdownPathStrategy.getPath(imageFilename)
  } else {
    // Save in new filesmap without changes
    const imageRecordFromDirectory = filesManager.get(
      "directory",
      "image",
      image.id
    )
    filesMap.set("image", image.id, imageRecordFromDirectory)
    updateImageUrlToMarkdownImagePath(image.file, imageRecordFromDirectory.path)
  }
}

export async function processImages({
  imageBlocks,
  filesManager,
  imageNamingStrategy,
  imageFilePathStrategy,
  options,
  filesMap,
  imageMarkdownPathStrategy,
  pages,
  databases,
}: {
  options: NotionPullOptions
  filesManager: FilesManager
  imageNamingStrategy: ImageNamingStrategy
  imageFilePathStrategy: PathStrategy
  filesMap: FilesMap
  imageMarkdownPathStrategy: PathStrategy
  imageBlocks: (BlockObjectResponse & { type: "image" })[]
  pages: NotionPage[]
  databases: NotionDatabase[]
}) {
  // Process image blocks
  for (const block of imageBlocks) {
    const image = new NotionImage(block)
    await processImage(
      image,
      filesManager,
      imageNamingStrategy,
      imageFilePathStrategy,
      imageMarkdownPathStrategy,
      options,
      filesMap
    )
  }

  // Processing of cover images of pages
  for (const page of pages) {
    // ------ Replacement of cover image
    const pageResponse = page.metadata
    const cover = pageResponse.cover
    if (!cover) {
      continue
    }
    const image = new NotionImage(pageResponse as PageObjectResponseWithCover)
    await processImage(
      image,
      filesManager,
      imageNamingStrategy,
      imageFilePathStrategy,
      imageMarkdownPathStrategy,
      options,
      filesMap
    )
  }

  for (const database of databases) {
    // ------ Replacement of cover image
    const databaseResponse = database.metadata
    const cover = databaseResponse.cover
    if (!cover) {
      continue
    }

    // TODO: Write/keep logic should go first. Cover writing `if` should go inside. Should save to filemap if exists
    const image = new NotionImage(
      databaseResponse as DatabaseObjectResponseWithCover
    )
    await processImage(
      image,
      filesManager,
      imageNamingStrategy,
      imageFilePathStrategy,
      imageMarkdownPathStrategy,
      options,
      filesMap
    )
  }
}

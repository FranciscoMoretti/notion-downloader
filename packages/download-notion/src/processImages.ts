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
  imageBlocks: (BlockObjectResponse & { type: "image" })[]
  filesManager: FilesManager
  imageNamingStrategy: ImageNamingStrategy
  imageFilePathStrategy: PathStrategy
  options: NotionPullOptions
  filesMap: FilesMap
  imageMarkdownPathStrategy: PathStrategy
  pages: NotionPage[]
  databases: NotionDatabase[]
}) {
  for (const block of imageBlocks) {
    const image = new NotionImage(block)
    if (filesManager.shouldProcessObject(image)) {
      await image.read()
      const imageFilename = imageNamingStrategy.getFileName(image)

      // TODO: Include layout strategy to get a potential layout from filename before adding prefix
      const imageFileOutputPath = imageFilePathStrategy.getPath(imageFilename)

      // TODO: All saves could be done in parallel
      await image.save(imageFileOutputPath)

      const pathFromImageDirectory = removePathPrefix(
        imageFileOutputPath,
        options.imgOutputPath
      )
      filesMap.set("image", image.id, {
        path: pathFromImageDirectory,
        lastEditedTime: image.lastEditedTime,
      })
      const filePathToUseInMarkdown =
        imageMarkdownPathStrategy.getPath(imageFilename)
      // Set the updated path
      updateImageUrlToMarkdownImagePath(block.image, filePathToUseInMarkdown)
    } else {
      // Save in new filesmap without changes
      const imageRecordFromRoot = filesManager.get(
        "directory",
        "image",
        image.id
      )
      filesMap.set("image", image.id, imageRecordFromRoot)
      // Update markdown in case pages link to this image
      const filePathToUseInMarkdown = imageRecordFromRoot.path
      updateImageUrlToMarkdownImagePath(block.image, filePathToUseInMarkdown)
    }
  }

  // Processing of cover images of pages
  for (const page of pages) {
    // ------ Replacement of cover image
    const pageResponse = page.metadata
    const cover = pageResponse.cover
    if (!cover) {
      continue
    }
    const shouldWritePage = filesManager.shouldProcessObject(page)
    if (shouldWritePage) {
      const image = new NotionImage(pageResponse as PageObjectResponseWithCover)
      await image.read()

      const imageFilename = imageNamingStrategy.getFileName(image)

      const imageFileOutputPath = imageFilePathStrategy.getPath(imageFilename)
      const filePathToUseInMarkdown =
        imageMarkdownPathStrategy.getPath(imageFilename)

      // TODO: All saves could be done in parallel
      await image.save(imageFileOutputPath)
      const pathFromImageDirectory = removePathPrefix(
        imageFileOutputPath,
        options.imgOutputPath
      )
      filesMap.set("image", image.id, {
        path: pathFromImageDirectory,
        lastEditedTime: image.lastEditedTime,
      })
      updateImageUrlToMarkdownImagePath(cover, filePathToUseInMarkdown)
    } else {
      const imageRecordFromRoot = filesManager.get(
        "directory",
        "image",
        page.id
      )
      filesMap.set("image", page.id, imageRecordFromRoot)
      // Update markdown in case pages link to this image
      const filePathToUseInMarkdown = imageRecordFromRoot.path
      updateImageUrlToMarkdownImagePath(cover, filePathToUseInMarkdown)
    }
  }

  for (const database of databases) {
    // ------ Replacement of cover image
    const databaseResponse = database.metadata
    const cover = databaseResponse.cover
    if (!cover) {
      continue
    }

    const shouldWriteDatabase = filesManager.shouldProcessObject(database)
    // TODO: Write/keep logic should go first. Cover writing `if` should go inside. Should save to filemap if exists
    if (shouldWriteDatabase) {
      const image = new NotionImage(
        databaseResponse as DatabaseObjectResponseWithCover
      )
      await image.read()

      const imageFilename = imageNamingStrategy.getFileName(image)

      const imageFileOutputPath = imageFilePathStrategy.getPath(imageFilename)
      const filePathToUseInMarkdown =
        imageMarkdownPathStrategy.getPath(imageFilename)

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
      updateImageUrlToMarkdownImagePath(cover, filePathToUseInMarkdown)
    } else {
      const imageRecordFromRoot = filesManager.get(
        "directory",
        "image",
        database.id
      )
      filesMap.set("image", database.id, imageRecordFromRoot)
      // Update markdown in case pages link to this image
      const filePathToUseInMarkdown = imageRecordFromRoot.path
      updateImageUrlToMarkdownImagePath(cover, filePathToUseInMarkdown)
    }
  }
}

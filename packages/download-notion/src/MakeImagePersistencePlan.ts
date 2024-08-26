import * as Path from "path"

import { NotionPullOptions } from "./config/schema"
import { FileData, ImageSet, OutputPaths } from "./images"

export interface PathStrategyOptions {
  pathPrefix?: string
}

export class PathStrategy {
  private pathPrefix: string

  constructor(options: PathStrategyOptions = {}) {
    this.pathPrefix = options.pathPrefix || ""
  }

  getPath(filename: string): string {
    const decodedFilename = decodeURI(filename)
    return Path.posix.join(this.pathPrefix, decodedFilename)
  }
}

export function getImagePaths(
  directoryContainingMarkdown: string,
  outputFileName: string,
  imageOutputRootPath: string,
  imagePrefixInMarkdown: string
): OutputPaths {
  const primaryPathStrategy = new PathStrategy({
    pathPrefix: imageOutputRootPath || directoryContainingMarkdown,
  })

  const markdownPathStrategy = new PathStrategy({
    pathPrefix: imagePrefixInMarkdown || ".",
  })

  return {
    primaryFileOutputPath: primaryPathStrategy.getPath(outputFileName),
    filePathToUseInMarkdown: markdownPathStrategy.getPath(outputFileName),
  }
}

export function makeImagePersistencePlan(
  options: NotionPullOptions,
  imageSet: ImageSet,
  fileData: FileData,
  imageBlockId: string,
  imageOutputRootPath: string,
  imagePrefixInMarkdown: string,
  directoryContainingMarkdown: string,
  pageSlug: string
): OutputPaths {
  const outputFileName = getOutputImageFileName(
    options,
    imageSet,
    fileData,
    imageBlockId,
    pageSlug
  )
  const { filePathToUseInMarkdown, primaryFileOutputPath } = getImagePaths(
    directoryContainingMarkdown,
    outputFileName,
    imageOutputRootPath,
    imagePrefixInMarkdown
  )
  return {
    filePathToUseInMarkdown,
    primaryFileOutputPath,
  }
}

import * as Path from "path"

import { NotionPullOptions } from "./config/schema"
import { FileData, ImageSet, OutputPaths } from "./images"

export function getImagePaths(
  directoryContainingMarkdown: string,
  outputFileName: string,
  imageOutputRootPath: string,
  imagePrefix: string
): OutputPaths {
  const primaryFileOutputPath = Path.posix.join(
    imageOutputRootPath?.length > 0
      ? imageOutputRootPath
      : directoryContainingMarkdown,
    decodeURI(outputFileName)
  )

  const filePathToUseInMarkdown =
    (imagePrefix?.length > 0 ? imagePrefix : ".") + "/" + outputFileName

  return {
    primaryFileOutputPath,
    filePathToUseInMarkdown,
  }
}

export function makeImagePersistencePlan(
  options: NotionPullOptions,
  imageSet: ImageSet,
  fileData: FileData,
  imageBlockId: string,
  imageOutputRootPath: string,
  imagePrefix: string,
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
    imagePrefix
  )
  return {
    filePathToUseInMarkdown,
    primaryFileOutputPath,
  }
}

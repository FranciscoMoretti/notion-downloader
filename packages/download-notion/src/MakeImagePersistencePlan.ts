import * as Path from "path"
import { exit } from "process"

import { NotionPullOptions } from "./config/schema"
import { ImageSet, MinimalImageSet, OutputPaths } from "./images"
import { error } from "./log"
import { findLastUuid, hashOfBufferContent, hashOfString } from "./utils"

export function getOutputImageFileName(
  options: NotionPullOptions,
  imageSet: ImageSet,
  imageBlockId: string,
  ancestorPageName?: string
): string {
  const urlBeforeQuery = imageSet.primaryUrl.split("?")[0]

  let imageFileExtension: string | undefined = imageSet.fileData?.ext
  if (!imageFileExtension) {
    imageFileExtension = urlBeforeQuery.split(".").pop()
    if (!imageFileExtension) {
      error(
        `Something wrong with the filetype extension on the blob we got from ${imageSet.primaryUrl}`
      )
      exit(1)
    }
  }

  if (options.imageFileNameFormat === "legacy") {
    // Original behavior and comment:
    //   Since most images come from pasting screenshots, there isn't normally a filename. That's fine, we just make a hash of the url
    //   Images that are stored by notion come to us with a complex url that changes over time, so we pick out the UUID that doesn't change. Example:
    //      https://s3.us-west-2.amazonaws.com/secure.notion-static.com/d1058f46-4d2f-4292-8388-4ad393383439/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20220516%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20220516T233630Z&X-Amz-Expires=3600&X-Amz-Signature=f215704094fcc884d37073b0b108cf6d1c9da9b7d57a898da38bc30c30b4c4b5&X-Amz-SignedHeaders=host&x-id=GetObject
    //   But around Sept 2023, they changed the url to be something like:
    //      https://prod-files-secure.s3.us-west-2.amazonaws.com/d9a2b712-cf69-4bd6-9d65-87a4ceeacca2/d1bcdc8c-b065-4e40-9a11-392aabeb220e/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230915%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230915T161258Z&X-Amz-Expires=3600&X-Amz-Signature=28fca48e65fba86d539c3c4b7676fce1fa0857aa194f7b33dd4a468ecca6ab24&X-Amz-SignedHeaders=host&x-id=GetObject
    //   The thing we want is the last UUID before the ?
    const thingToHash = findLastUuid(urlBeforeQuery) ?? urlBeforeQuery

    const hash = hashOfString(thingToHash)
    return `${hash}.${imageFileExtension}`
  } else if (options.imageFileNameFormat === "content-hash") {
    // This was requested by a user: https://github.com/sillsdev/docu-notion/issues/76.
    // We chose not to include it in the default file name because we want to maintain
    // as much stability in the file name as feasible for an image localization workflow.
    // However, particularly in a workflow which is not concerned with localization,
    // this could be a good option. One benefit is that the image only needs to exist once
    // in the file system regardless of how many times it is used in the site.
    const imageHash = hashOfBufferContent(imageSet.fileData?.buffer!)
    return `${imageHash}.${imageFileExtension}`
  } else {
    // We decided not to do this for the default format because it means
    // instability for the file name in Crowdin, which causes loss of localizations.
    // If we decide to include it in the future, we should add a unit test.
    // const imageFileName = Path.basename(urlBeforeQuery);
    // const imageFileNameWithoutExtension = Path.parse(imageFileName).name;
    // const originalFileNamePart = ["untitled", "unnamed"].includes(
    //   imageFileNameWithoutExtension.toLocaleLowerCase()
    // )
    //   ? ""
    //   : `${imageFileNameWithoutExtension.substring(0, 50)}.`;

    // Format is page slug (if there is one) followed by the image block ID from Notion.
    // The image block ID will remain stable as long as any changes to the image are done
    // using the Replace feature. Also, image blocks can be moved using the Move To feature.
    // We decided to include the page slug for easier workflow during localization, particularly in Crowdin.
    // The block ID is a unique GUID and thus provides a unique file name.
    // TODO: Manage image paths with FilesMap
    const pageSlugPart = ancestorPageName
      ? `${ancestorPageName.replace(/^\//, "")}.`
      : ""
    return `${pageSlugPart}${imageBlockId}.${imageFileExtension}`
  }
}

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
    outputFileName,
    primaryFileOutputPath,
    filePathToUseInMarkdown,
  }
}

export function makeImagePersistencePlan(
  options: NotionPullOptions,
  imageSet: ImageSet,
  imageBlockId: string,
  imageOutputRootPath: string,
  imagePrefix: string
): void {
  const outputFileName = getOutputImageFileName(
    options,
    imageSet,
    imageBlockId,
    imageSet.pageInfo?.slug
  )
  const { filePathToUseInMarkdown, primaryFileOutputPath } = getImagePaths(
    imageSet.pageInfo!.directoryContainingMarkdown,
    outputFileName,
    imageOutputRootPath,
    imagePrefix
  )
  imageSet.outputPaths = {
    filePathToUseInMarkdown,
    primaryFileOutputPath,
    outputFileName,
  }
}

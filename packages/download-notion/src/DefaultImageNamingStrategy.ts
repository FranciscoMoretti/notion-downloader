import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionPullOptions } from "./config/schema"
import { getImageFileExtension } from "./getImageFileExtension"
import { FileData, ImageSet } from "./images"

export class DefaultImageNamingStrategy implements ImageNamingStrategy {
  getFileName(
    imageSet: ImageSet,
    fileData: FileData,
    imageBlockId: string,
    ancestorPageName: string
  ): string {
    // Don't start with . for empty ancestor page name
    const pageSlugPart = ancestorPageName
      ? `${ancestorPageName.replace(/^\//, "")}.`
      : ""
    return `${pageSlugPart}${imageBlockId}.${getImageFileExtension(
      fileData,
      imageSet.primaryUrl
    )}`
  }
}

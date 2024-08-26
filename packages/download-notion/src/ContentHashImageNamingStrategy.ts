import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionPullOptions } from "./config/schema"
import { getImageFileExtension } from "./getImageFileExtension"
import { FileData, ImageSet } from "./images"
import { hashOfBufferContent } from "./utils"

// One benefit is that the image only needs to exist once
// in the file system regardless of how many times it is used in the site.

export class ContentHashImageNamingStrategy implements ImageNamingStrategy {
  getFileName(
    imageSet: ImageSet,
    fileData: FileData,
    imageBlockId: string,
    ancestorPageName?: string
  ): string {
    const imageHash = hashOfBufferContent(fileData.buffer!)
    return `${imageHash}.${getImageFileExtension(
      fileData,
      imageSet.primaryUrl
    )}`
  }
}

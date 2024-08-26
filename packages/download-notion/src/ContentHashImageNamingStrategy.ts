import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionImage } from "./NotionImage"
import { hashOfBufferContent } from "./utils"

// One benefit is that the image only needs to exist once
// in the file system regardless of how many times it is used in the site.

export class ContentHashImageNamingStrategy implements ImageNamingStrategy {
  getFileName(image: NotionImage): string {
    const imageHash = hashOfBufferContent(image.buffer)
    return `${imageHash}.${image.extension}`
  }
}

import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionImage } from "./NotionImage"
import { NotionPullOptions } from "./config/schema"
import { getImageFileExtension } from "./getImageFileExtension"
import { PlainObjectsMap } from "./objects_utils"

export class DefaultImageNamingStrategy implements ImageNamingStrategy {
  private readonly getPageAncestorFilename: (image: NotionImage) => string

  constructor(getPageAncestorFilename: (image: NotionImage) => string) {
    this.getPageAncestorFilename = getPageAncestorFilename
  }

  getFileName(image: NotionImage): string {
    // Don't start with . for empty ancestor page name
    const pageSlugPart = this.getPageAncestorFilename(image)
      ? `${this.getPageAncestorFilename(image)}.`
      : ""
    return `${pageSlugPart}${image.id}.${image.extension}`
  }
}

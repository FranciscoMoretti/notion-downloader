import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionImage } from "./NotionImage"

export class DefaultImageNamingStrategy implements ImageNamingStrategy {
  private readonly getPageAncestorName: (image: NotionImage) => string

  constructor(getPageAncestorName: (image: NotionImage) => string) {
    this.getPageAncestorName = getPageAncestorName
  }

  getFileName(image: NotionImage): string {
    // Don't start with . for empty ancestor page name
    const pageSlugPart = this.getPageAncestorName(image)
      ? `${this.getPageAncestorName(image)}.`
      : ""
    return `${pageSlugPart}${image.id}.${image.extension}`
  }
}

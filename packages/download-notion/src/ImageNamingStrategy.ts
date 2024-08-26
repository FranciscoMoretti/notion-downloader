import { NotionImage } from "./NotionImage"
import { FileData, ImageSet } from "./images"

export interface ImageNamingStrategy {
  getFileName(image: NotionImage): string
}

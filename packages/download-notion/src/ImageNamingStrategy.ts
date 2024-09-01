import { NotionImage } from "./NotionImage"

export interface ImageNamingStrategy {
  getFileName(image: NotionImage): string
}

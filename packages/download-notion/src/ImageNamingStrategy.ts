import { FileData, ImageSet } from "./images"

export interface ImageNamingStrategy {
  getFileName(
    imageSet: ImageSet,
    fileData: FileData,
    imageBlockId: string,
    ancestorPageName?: string
  ): string
}

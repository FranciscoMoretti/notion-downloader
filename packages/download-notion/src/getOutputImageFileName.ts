import { ContentHashImageNamingStrategy } from "./ContentHashImageNamingStrategy"
import { DefaultImageNamingStrategy } from "./DefaultImageNamingStrategy"
import { FilesMap } from "./FilesMap"
import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { LegacyImageNamingStrategy } from "./LegacyImageNamingStrategy"
import { NotionImage } from "./NotionImage"
import { NotionPullOptions } from "./config/schema"
import { FileData, ImageSet } from "./images"
import { PlainObjectsMap } from "./objects_utils"

export function getStrategy(
  format: "legacy" | "content-hash" | "default",
  getPageAncestorFilename: (image: NotionImage) => string
): ImageNamingStrategy {
  switch (format) {
    case "legacy":
      return new LegacyImageNamingStrategy()
    case "content-hash":
      return new ContentHashImageNamingStrategy()
    case "default":
      return new DefaultImageNamingStrategy(getPageAncestorFilename)
    default:
      throw new Error(`Unknown image file name format: ${format}`)
  }
}

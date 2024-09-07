import { DefaultImageNamingStrategy } from "./DefaultImageNamingStrategy"
import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { LegacyImageNamingStrategy } from "./LegacyImageNamingStrategy"
import { NotionImage } from "./NotionImage"

export function getImageNamingStrategy(
  format: "legacy" | "default" | "default-flat",
  getPageAncestorName: (image: NotionImage) => string
): ImageNamingStrategy {
  switch (format) {
    case "legacy":
      return new LegacyImageNamingStrategy()
    case "default":
    case "default-flat":
      return new DefaultImageNamingStrategy(getPageAncestorName)
    default:
      throw new Error(`Unknown image file name format: ${format}`)
  }
}

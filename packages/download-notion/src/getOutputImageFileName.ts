import { ContentHashImageNamingStrategy } from "./ContentHashImageNamingStrategy"
import { DefaultImageNamingStrategy } from "./DefaultImageNamingStrategy"
import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { LegacyImageNamingStrategy } from "./LegacyImageNamingStrategy"
import { NotionImage } from "./NotionImage"

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

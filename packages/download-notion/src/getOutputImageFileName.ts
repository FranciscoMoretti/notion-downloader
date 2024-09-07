import { DefaultBlockNamingStrategy } from "./DefaultImageNamingStrategy"
import { LegacyImageNamingStrategy } from "./LegacyImageNamingStrategy"
import { NamingStrategy } from "./NamingStrategy"
import { NotionImage } from "./NotionImage"

export function getImageNamingStrategy(
  format: "legacy" | "default" | "default-flat",
  getPageAncestorName: (image: NotionImage) => string
): NamingStrategy {
  switch (format) {
    case "legacy":
      return new LegacyImageNamingStrategy()
    case "default":
    case "default-flat":
      return new DefaultBlockNamingStrategy(getPageAncestorName)
    default:
      throw new Error(`Unknown image file name format: ${format}`)
  }
}

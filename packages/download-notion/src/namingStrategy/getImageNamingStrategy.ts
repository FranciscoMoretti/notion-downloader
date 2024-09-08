import { NotionImageLike } from "../objectTypes"
import { DefaultBlockNamingStrategy } from "./DefaultImageNamingStrategy"
import { LegacyImageNamingStrategy } from "./LegacyImageNamingStrategy"
import { NamingStrategy } from "./NamingStrategy"

export function getImageNamingStrategy(
  format: "legacy" | "default" | "default-flat",
  getPageAncestorName: (image: NotionImageLike) => string
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

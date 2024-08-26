import { ContentHashImageNamingStrategy } from "./ContentHashImageNamingStrategy"
import { DefaultImageNamingStrategy } from "./DefaultImageNamingStrategy"
import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { LegacyImageNamingStrategy } from "./LegacyImageNamingStrategy"
import { NotionPullOptions } from "./config/schema"
import { FileData, ImageSet } from "./images"

export function getOutputImageFileName(
  options: NotionPullOptions,
  imageSet: ImageSet,
  fileData: FileData,
  imageBlockId: string,
  ancestorPageName?: string
): string {
  const strategy: ImageNamingStrategy = getStrategy(options.imageFileNameFormat)
  return strategy.getFileName(
    imageSet,
    fileData,
    imageBlockId,
    ancestorPageName
  )
}

function getStrategy(format: string): ImageNamingStrategy {
  switch (format) {
    case "legacy":
      return new LegacyImageNamingStrategy()
    case "content-hash":
      return new ContentHashImageNamingStrategy()
    default:
      return new DefaultImageNamingStrategy()
  }
}

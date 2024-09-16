import { NotionImageLike } from "../notionObjects/objectTypes"
import { DefaultBlockNamingStrategy } from "./DefaultImageNamingStrategy"
import { LegacyImageNamingStrategy } from "./LegacyImageNamingStrategy"
import { NamingStrategy } from "./NamingStrategy"
import {
  GithubSlugNamingStrategy,
  GuidNamingStrategy,
  NotionSlugNamingStrategy,
  TitleNamingStrategy,
} from "./namingStrategies"

export function getImageNamingStrategy(
  format: "legacy" | "default",
  getPageAncestorName: (image: NotionImageLike) => string
): NamingStrategy {
  switch (format) {
    case "legacy":
      return new LegacyImageNamingStrategy()
    case "default":
      return new DefaultBlockNamingStrategy(getPageAncestorName)
    default:
      throw new Error(`Unknown image file name format: ${format}`)
  }
}
export function getMarkdownNamingStrategy(
  namingStrategy: "github-slug" | "notion-slug" | "guid" | "title",
  slugProperty: string
) {
  return namingStrategy === "github-slug"
    ? new GithubSlugNamingStrategy(slugProperty)
    : namingStrategy === "notion-slug"
    ? new NotionSlugNamingStrategy(slugProperty)
    : namingStrategy === "guid"
    ? new GuidNamingStrategy()
    : new TitleNamingStrategy()
}

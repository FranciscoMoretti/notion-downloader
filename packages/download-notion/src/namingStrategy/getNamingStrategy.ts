import { NotionObject } from "../notionObjects/NotionObject"
import { NotionImageLike } from "../notionObjects/objectTypes"
import { AncestorPrefixAssetNamingStrategy } from "./AncestorPrefixAssetNamingStrategy"
import { LegacyImageNamingStrategy } from "./LegacyImageNamingStrategy"
import { NamingStrategy } from "./NamingStrategy"
import {
  GithubSlugNamingStrategy,
  GuidNamingStrategy,
  NotionSlugNamingStrategy,
  TitleNamingStrategy,
} from "./namingStrategies"

export function getAssetNamingStrategy(
  namingStrategy: "ancestor-prefix" | "legacy" | "default",
  getPageAncestorName: (notionObject: NotionObject) => string
): NamingStrategy {
  switch (namingStrategy) {
    case "default":
      return new AncestorPrefixAssetNamingStrategy(getPageAncestorName)
    case "ancestor-prefix":
      return new AncestorPrefixAssetNamingStrategy(getPageAncestorName)
    case "legacy":
      return new LegacyImageNamingStrategy()
    default:
      throw new Error(`Unknown image file name format: ${namingStrategy}`)
  }
}
export function getMarkdownNamingStrategy(
  namingStrategy: "github-slug" | "notion-slug" | "guid" | "title" | "default",
  slugProperty: string
) {
  switch (namingStrategy) {
    case "default":
      return new TitleNamingStrategy()
    case "github-slug":
      return new GithubSlugNamingStrategy(slugProperty)
    case "notion-slug":
      return new NotionSlugNamingStrategy(slugProperty)
    case "guid":
      return new GuidNamingStrategy()
    case "title":
      return new TitleNamingStrategy()
    default:
      throw new Error(`Unknown markdown file name format: ${namingStrategy}`)
  }
}

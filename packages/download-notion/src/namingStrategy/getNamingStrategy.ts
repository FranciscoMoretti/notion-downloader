import {
  AllNamingSchemaName,
  AssetNamingStrategyNames,
  AssetNamingStrategyType,
  MarkdownNamingStrategyNames,
  MarkdownNamingStrategyType,
} from "../config/schema"
import { NotionObject } from "../notionObjects/NotionObject"
import { AncestorPrefixAssetNamingStrategy } from "./AncestorPrefixAssetNamingStrategy"
import { LegacyAssetNamingStrategy } from "./LegacyAssetNamingStrategy"
import { NamingStrategy } from "./NamingStrategy"
import {
  GithubSlugNamingStrategy,
  GuidNamingStrategy,
  NotionSlugNamingStrategy,
  TitleNamingStrategy,
} from "./namingStrategies"

export function getAssetNamingStrategy(
  namingStrategy: AssetNamingStrategyType,
  getPageAncestorName: (notionObject: NotionObject) => string
): NamingStrategy {
  switch (namingStrategy) {
    case AllNamingSchemaName.Default:
      return new AncestorPrefixAssetNamingStrategy(getPageAncestorName)
    case AllNamingSchemaName.Guid:
      return new GuidNamingStrategy()
    case AssetNamingStrategyNames.AncestorPrefix:
      return new AncestorPrefixAssetNamingStrategy(getPageAncestorName)
    case AssetNamingStrategyNames.Legacy:
      return new LegacyAssetNamingStrategy()
    default:
      throw new Error(`Unknown image file name format: ${namingStrategy}`)
  }
}
export function getMarkdownNamingStrategy(
  namingStrategy: MarkdownNamingStrategyType,
  slugProperty: string
) {
  switch (namingStrategy) {
    case AllNamingSchemaName.Default:
      return new TitleNamingStrategy()
    case AllNamingSchemaName.Guid:
      return new GuidNamingStrategy()
    case MarkdownNamingStrategyNames.GithubSlug:
      return new GithubSlugNamingStrategy(slugProperty)
    case MarkdownNamingStrategyNames.NotionSlug:
      return new NotionSlugNamingStrategy(slugProperty)
    case MarkdownNamingStrategyNames.Title:
      return new TitleNamingStrategy()
    default:
      throw new Error(`Unknown markdown file name format: ${namingStrategy}`)
  }
}

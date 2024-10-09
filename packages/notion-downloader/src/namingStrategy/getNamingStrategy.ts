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
  UrlEncodingNamingStrategy,
} from "./namingStrategies"

export function getAssetNamingStrategy(
  namingStrategy: AssetNamingStrategyType,
  getPageAncestorName: (notionObject: NotionObject) => string
): NamingStrategy {
  switch (namingStrategy) {
    case AllNamingSchemaName.enum.default:
      return new AncestorPrefixAssetNamingStrategy(getPageAncestorName)
    case AllNamingSchemaName.enum.guid:
      return new GuidNamingStrategy()
    case AssetNamingStrategyNames.enum.ancestorPrefix:
      return new AncestorPrefixAssetNamingStrategy(getPageAncestorName)
    case AssetNamingStrategyNames.enum.legacy:
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
    case AllNamingSchemaName.enum.default:
      return new TitleNamingStrategy()
    case AllNamingSchemaName.enum.guid:
      return new GuidNamingStrategy()
    case MarkdownNamingStrategyNames.enum.urlEncoding:
      return new UrlEncodingNamingStrategy()
    case MarkdownNamingStrategyNames.enum.githubSlug:
      return new GithubSlugNamingStrategy(slugProperty)
    case MarkdownNamingStrategyNames.enum.notionSlug:
      return new NotionSlugNamingStrategy(slugProperty)
    case MarkdownNamingStrategyNames.enum.title:
      return new TitleNamingStrategy()
    default:
      throw new Error(`Unknown markdown file name format: ${namingStrategy}`)
  }
}

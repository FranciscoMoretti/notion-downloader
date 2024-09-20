import { ObjectType } from "notion-cache-client"
import { NotionObjectTree } from "notion-downloader"

import {
  AssetType,
  GenericGroup,
  LayoutStrategyGroupOptions,
  NamingStrategyGroupOptions,
  NotionPullOptions,
  parseLayoutStrategyFileOptions,
  parseNamingStrategyFileOptions,
} from "./config/schema"
import { FilesManager } from "./files/FilesManager"
import { LayoutStrategy } from "./layoutStrategy/LayoutStrategy"
import { getLayoutStrategy } from "./layoutStrategy/getLayoutStrategy"
import { NamingStrategy } from "./namingStrategy/NamingStrategy"
import {
  getAssetNamingStrategy,
  getMarkdownNamingStrategy,
} from "./namingStrategy/getNamingStrategy"
import { getAncestorPageOrDatabaseFilename } from "./utils"

export type LayoutStrategyGroup = GenericGroup<LayoutStrategy>
type NamingStrategyGroup = GenericGroup<NamingStrategy>

export function createStrategies(
  options: NotionPullOptions,
  objectsTree: NotionObjectTree,
  newFilesManager: FilesManager
): LayoutStrategyGroup {
  const namingStrategiesOptions = parseNamingStrategyFileOptions(
    options.conversion.namingStrategy
  )

  const namingStrategies: NamingStrategyGroup = getNamingStrategies(
    namingStrategiesOptions,
    options.conversion.slugProperty || "",
    objectsTree,
    newFilesManager
  )
  const layoutStrategyOptions = parseLayoutStrategyFileOptions(
    options.conversion.layoutStrategy
  )

  const layoutStrategies: LayoutStrategyGroup = getLayoutStrategies(
    layoutStrategyOptions,
    namingStrategies
  )
  return layoutStrategies
}

function getLayoutStrategies(
  layoutStrategyOptions: LayoutStrategyGroupOptions,
  namingStrategies: NamingStrategyGroup
): LayoutStrategyGroup {
  return {
    [ObjectType.enum.page]: getLayoutStrategy(
      layoutStrategyOptions[ObjectType.enum.page],
      namingStrategies[ObjectType.enum.page]
    ),
    [ObjectType.enum.database]: getLayoutStrategy(
      layoutStrategyOptions[ObjectType.enum.database],
      namingStrategies[ObjectType.enum.database]
    ),
    [AssetType.enum.image]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.enum.image],
      namingStrategies[AssetType.enum.image]
    ),
    [AssetType.enum.file]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.enum.file],
      namingStrategies[AssetType.enum.file]
    ),
    [AssetType.enum.video]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.enum.video],
      namingStrategies[AssetType.enum.video]
    ),
    [AssetType.enum.pdf]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.enum.pdf],
      namingStrategies[AssetType.enum.pdf]
    ),
    [AssetType.enum.audio]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.enum.audio],
      namingStrategies[AssetType.enum.audio]
    ),
  }
}

function getNamingStrategies(
  namingStrategyOptions: NamingStrategyGroupOptions,
  slugProperty: string,
  objectsTree: NotionObjectTree,
  newFilesManager: FilesManager
): NamingStrategyGroup {
  return {
    [ObjectType.enum.page]: getMarkdownNamingStrategy(
      namingStrategyOptions[ObjectType.enum.page],
      slugProperty
    ),
    [ObjectType.enum.database]: getMarkdownNamingStrategy(
      namingStrategyOptions[ObjectType.enum.database],

      slugProperty
    ),
    [AssetType.enum.image]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.enum.image],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
    [AssetType.enum.file]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.enum.file],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
    [AssetType.enum.video]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.enum.video],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
    [AssetType.enum.pdf]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.enum.pdf],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
    [AssetType.enum.audio]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.enum.audio],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
  }
}

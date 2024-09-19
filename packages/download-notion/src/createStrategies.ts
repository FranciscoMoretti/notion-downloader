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
    [ObjectType.Page]: getLayoutStrategy(
      layoutStrategyOptions[ObjectType.Page],
      namingStrategies[ObjectType.Page]
    ),
    [ObjectType.Database]: getLayoutStrategy(
      layoutStrategyOptions[ObjectType.Database],
      namingStrategies[ObjectType.Database]
    ),
    [AssetType.Image]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.Image],
      namingStrategies[AssetType.Image]
    ),
    [AssetType.File]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.File],
      namingStrategies[AssetType.File]
    ),
    [AssetType.Video]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.Video],
      namingStrategies[AssetType.Video]
    ),
    [AssetType.PDF]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.PDF],
      namingStrategies[AssetType.PDF]
    ),
    [AssetType.Audio]: getLayoutStrategy(
      layoutStrategyOptions[AssetType.Audio],
      namingStrategies[AssetType.Audio]
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
    [ObjectType.Page]: getMarkdownNamingStrategy(
      namingStrategyOptions[ObjectType.Page],
      slugProperty
    ),
    [ObjectType.Database]: getMarkdownNamingStrategy(
      namingStrategyOptions[ObjectType.Database],

      slugProperty
    ),
    [AssetType.Image]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.Image],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
    [AssetType.File]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.File],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
    [AssetType.Video]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.Video],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
    [AssetType.PDF]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.PDF],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
    [AssetType.Audio]: getAssetNamingStrategy(
      namingStrategyOptions[AssetType.Audio],
      (notionObject) =>
        getAncestorPageOrDatabaseFilename(
          notionObject,
          objectsTree,
          newFilesManager
        )
    ),
  }
}

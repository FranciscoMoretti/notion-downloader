import { ObjectType } from "notion-cache-client"
import { NotionObjectTree } from "notion-downloader"

import {
  AssetType,
  GenericGroup,
  LayoutStrategyGroupOptions,
  NotionPullOptions,
  parseLayoutStrategyFileOptions,
} from "./config/schema"
import { FilesManager } from "./files/FilesManager"
import { getLayoutStrategy } from "./getLayoutStrategy"
import { LayoutStrategy } from "./layoutStrategy/LayoutStrategy"
import { NamingStrategy } from "./namingStrategy/NamingStrategy"
import {
  getImageNamingStrategy,
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
  const namingStrategies: NamingStrategyGroup = getNamingStrategies(
    options,
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
  options: NotionPullOptions,
  objectsTree: NotionObjectTree,
  newFilesManager: FilesManager
): NamingStrategyGroup {
  return {
    [ObjectType.Page]: getMarkdownNamingStrategy(
      options.conversion.namingStrategy,
      options.conversion.slugProperty || ""
    ),
    [ObjectType.Database]: getMarkdownNamingStrategy(
      options.conversion.namingStrategy,
      options.conversion.slugProperty || ""
    ),
    [AssetType.Image]: getImageNamingStrategy(
      options.conversion.imageNamingStrategy || "default",
      (image) =>
        getAncestorPageOrDatabaseFilename(image, objectsTree, newFilesManager)
    ),
    [AssetType.File]: getImageNamingStrategy(
      options.conversion.imageNamingStrategy || "default",
      (image) =>
        getAncestorPageOrDatabaseFilename(image, objectsTree, newFilesManager)
    ),
    [AssetType.Video]: getImageNamingStrategy(
      options.conversion.imageNamingStrategy || "default",
      (image) =>
        getAncestorPageOrDatabaseFilename(image, objectsTree, newFilesManager)
    ),
    [AssetType.PDF]: getImageNamingStrategy(
      options.conversion.imageNamingStrategy || "default",
      (image) =>
        getAncestorPageOrDatabaseFilename(image, objectsTree, newFilesManager)
    ),
    [AssetType.Audio]: getImageNamingStrategy(
      options.conversion.imageNamingStrategy || "default",
      (image) =>
        getAncestorPageOrDatabaseFilename(image, objectsTree, newFilesManager)
    ),
  }
}

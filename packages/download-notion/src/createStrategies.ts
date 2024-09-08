import { NotionObjectTree } from "notion-downloader"

import { NotionPullOptions } from "./config/schema"
import { FilesManager } from "./files/FilesManager"
import { FlatLayoutStrategy } from "./layoutStrategy/FlatLayoutStrategy"
import { HierarchicalLayoutStrategy } from "./layoutStrategy/HierarchicalLayoutStrategy"
import { NamingStrategy } from "./namingStrategy/NamingStrategy"
import {
  getImageNamingStrategy,
  getMarkdownNamingStrategy,
} from "./namingStrategy/getNamingStrategy"
import { getAncestorPageOrDatabaseFilename } from "./utils"

export function createStrategies(
  options: NotionPullOptions,
  objectsTree: NotionObjectTree,
  newFilesManager: FilesManager
) {
  const markdownLayoutStrategy = createMakrdownLayoutStrategy(options)
  const imageLayoutStrategy = createImageLayoutStrategy(
    options,
    objectsTree,
    newFilesManager
  )
  return { markdownLayoutStrategy, imageLayoutStrategy }
}

function createImageLayoutStrategy(
  options: NotionPullOptions,
  objectsTree: NotionObjectTree,
  newFilesManager: FilesManager
) {
  const imageNamingStrategy = createImageNamingStrategy(
    options,
    objectsTree,
    newFilesManager
  )
  return createLayoutStrategy(
    options.conversion.imageLayoutStrategy,
    imageNamingStrategy
  )
}

function createMakrdownLayoutStrategy(options: NotionPullOptions) {
  const namingStrategy = getMarkdownNamingStrategy(
    options.conversion.namingStrategy,
    // TODO: SLug naming strategies shouldn't have a blank value or undefined. Default should be in option parsing
    options.conversion.slugProperty || ""
  )

  const layoutStrategy = createLayoutStrategy(
    options.conversion.layoutStrategy,
    namingStrategy
  )
  return layoutStrategy
}

function createImageNamingStrategy(
  options: NotionPullOptions,
  objectsTree: NotionObjectTree,
  newFilesManager: FilesManager
) {
  const imageNamingStrategy = getImageNamingStrategy(
    options.conversion.imageNamingStrategy || "default",
    // TODO: A new strategy could be with ancestor filename `getAncestorPageOrDatabaseFilename`
    (image) =>
      getAncestorPageOrDatabaseFilename(image, objectsTree, newFilesManager)
  )
  return imageNamingStrategy
}

function createLayoutStrategy(
  layoutStrategy: "HierarchicalNamedLayoutStrategy" | "FlatLayoutStrategy",
  namingStrategy: NamingStrategy
) {
  return layoutStrategy === "FlatLayoutStrategy"
    ? new FlatLayoutStrategy(namingStrategy)
    : new HierarchicalLayoutStrategy(namingStrategy)
}

import { ObjectType } from "notion-cache-client"
import { NotionObjectResponse, NotionObjectTree } from "notion-tree"

import { MarkdownExtension } from "./config/schema"
import { LayoutStrategyGroup } from "./createStrategies"
import { FilesManager, copyRecord } from "./files/FilesManager"
import { LayoutStrategy } from "./layoutStrategy/LayoutStrategy"
import { getNotionObject } from "./notionObjects/NotionObjectUtils"
import { iNotionAssetObject } from "./notionObjects/objectTypes"
import {
  NotionAssetObjectResponses,
  getAssetObjectFromObjectResponse,
  getAssetTypeFromObjectResponse,
} from "./notionObjects/objectutils"
import { FileBuffersMemory } from "./types"

export function getFileTreeMap(
  starterPath: string,
  objectsTree: NotionObjectTree,
  databaseIsRootLevel: boolean,
  layoutStrategies: LayoutStrategyGroup,
  existingFilesManager: FilesManager,

  newFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory,
  markdownExtension: MarkdownExtension
) {
  const nodeAction = (
    objectResponse: NotionObjectResponse,
    parentContext: {
      path: string
      databaseIsRoot: boolean
    }
  ) => {
    const notionObject = getNotionObject(objectResponse, markdownExtension)

    // New level path is created by objects that can contain files as children
    const newLevelPath =
      !parentContext.databaseIsRoot &&
      (notionObject.object === ObjectType.enum.page ||
        notionObject.object === ObjectType.enum.database)
        ? layoutStrategies[notionObject.object].newPathLevel(
            parentContext.path,
            notionObject
          )
        : parentContext.path

    if (
      notionObject.object === ObjectType.enum.page ||
      notionObject.object === ObjectType.enum.database
    ) {
      if (existingFilesManager.exists(notionObject.object, notionObject.id)) {
        // TODO: Copying or setting a new one should be handled internally by something that contains old and new file managers
        copyRecord(
          existingFilesManager,
          newFilesManager,
          notionObject.object,
          notionObject.id
        )
      } else {
        const objectPath =
          notionObject.object == ObjectType.enum.database
            ? newLevelPath
            : layoutStrategies[notionObject.object].getPathForObject(
                parentContext.path,
                notionObject
              )
        newFilesManager.set("base", notionObject.object, notionObject.id, {
          path: objectPath,
          lastEditedTime: notionObject.lastEditedTime,
        })
      }
    }

    const assetType = getAssetTypeFromObjectResponse(objectResponse)
    if (assetType) {
      if (existingFilesManager.exists(assetType, objectResponse.id)) {
        copyRecord(
          existingFilesManager,
          newFilesManager,
          assetType,
          objectResponse.id
        )
      } else {
        const asset = getAssetObjectFromObjectResponse(
          objectResponse as NotionAssetObjectResponses
        )
        setFilebufferInAsset(filesInMemory, asset)
        const assetFilename = layoutStrategies[assetType].getPathForObject(
          parentContext.path,
          asset
        )
        newFilesManager.set("base", assetType, asset.id, {
          path: assetFilename,
          lastEditedTime: asset.lastEditedTime,
        })
      }
    }

    return {
      path: newLevelPath,
      databaseIsRoot: false,
    }
  }
  objectsTree.traverse(nodeAction, {
    path: starterPath,
    databaseIsRoot: databaseIsRootLevel,
  })
}

function setFilebufferInAsset(
  filesInMemory: FileBuffersMemory,
  asset: iNotionAssetObject
) {
  const fileBuffer = filesInMemory[asset.id]
  if (!fileBuffer) {
    throw new Error(`File buffer not found for asset ${asset.id}`)
  }
  asset.setFileBuffer(fileBuffer)
}

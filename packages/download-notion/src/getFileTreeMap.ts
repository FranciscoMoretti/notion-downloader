import { NotionObjectResponse, NotionObjectTree } from "notion-downloader"

import { FilesManager, copyRecord } from "./files/FilesManager"
import { LayoutStrategy } from "./layoutStrategy/LayoutStrategy"
import { getNotionObject } from "./notionObjects/NotionObjectUtils"
import {
  NotionImageLike,
  iNotionAssetObject,
} from "./notionObjects/objectTypes"
import {
  NotionAssetObjectResponses,
  getAssetObjectFromObjectResponse,
  getAssetTypeFromObjectResponse,
  getImageLikeObject,
  hasImageLikeObject,
} from "./notionObjects/objectutils"
import { FileBuffersMemory } from "./types"

export function getFileTreeMap(
  starterPath: string,
  objectsTree: NotionObjectTree,
  databaseIsRootLevel: boolean,
  markdownLayoutStrategy: LayoutStrategy,
  imageLayoutStrategy: LayoutStrategy,
  existingFilesManager: FilesManager,

  newFilesManager: FilesManager,
  filesInMemory: FileBuffersMemory
) {
  const nodeAction = (
    objectResponse: NotionObjectResponse,
    parentContext: {
      path: string
      databaseIsRoot: boolean
    }
  ) => {
    const notionObject = getNotionObject(objectResponse)

    // New level path is created by objects that can contain files as children
    const newLevelPath =
      !parentContext.databaseIsRoot &&
      (notionObject.object === "page" || notionObject.object === "database")
        ? markdownLayoutStrategy.newPathLevel(parentContext.path, notionObject)
        : parentContext.path

    if (notionObject.object === "page" || notionObject.object === "database") {
      if (existingFilesManager.exists(notionObject.object, notionObject.id)) {
        copyRecord(
          existingFilesManager,
          newFilesManager,
          notionObject.object,
          notionObject.id
        )
      } else {
        const objectPath =
          notionObject.object == "database"
            ? newLevelPath
            : markdownLayoutStrategy.getPathForObject(
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
        setFilebufferInImage(filesInMemory, asset)
        const imageFilename = imageLayoutStrategy.getPathForObject(
          parentContext.path,
          asset
        )
        newFilesManager.set("base", assetType, asset.id, {
          path: imageFilename,
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

function setFilebufferInImage(
  filesInMemory: FileBuffersMemory,
  asset: iNotionAssetObject
) {
  const fileBuffer = filesInMemory[asset.id]
  if (!fileBuffer) {
    throw new Error(`File buffer not found for asset ${asset.id}`)
  }
  asset.setFileBuffer(fileBuffer)
}

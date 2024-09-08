import { NotionObjectResponse, NotionObjectTree } from "notion-downloader"

import { FilesManager, copyRecord } from "./FilesManager"
import { NotionBlockImage } from "./NotionBlockImage"
import { NotionFile } from "./NotionFile"
import { getNotionObject } from "./NotionObjectUtils"
import { LayoutStrategy } from "./layoutStrategy/LayoutStrategy"
import { getImageLikeObject, hasImageLikeObject } from "./objects_utils"
import { FileBuffersMemory } from "./processImages"

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

    if (hasImageLikeObject(objectResponse)) {
      if (existingFilesManager.exists("image", objectResponse.id)) {
        copyRecord(
          existingFilesManager,
          newFilesManager,
          "image",
          objectResponse.id
        )
      } else {
        const image = getImageLikeObject(objectResponse)
        const fileBuffer = filesInMemory[objectResponse.id]
        if (!fileBuffer) {
          throw new Error(
            `File buffer not found for asset ${objectResponse.id}`
          )
        }
        image.setFileBuffer(fileBuffer)
        const imageFilename = imageLayoutStrategy.getPathForObject(
          parentContext.path,
          image
        )
        newFilesManager.set("base", "image", image.id, {
          path: imageFilename,
          lastEditedTime: image.lastEditedTime,
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

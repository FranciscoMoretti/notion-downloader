import { NotionObjectResponse, NotionObjectTree } from "notion-downloader"

import { FilesManager } from "./FilesManager"
import { LayoutStrategy } from "./LayoutStrategy"
import { NotionImage } from "./NotionImage"
import { getNotionObject } from "./NotionObjectUtils"

export function getFileTreeMap(
  currentPath: string,
  objectsTree: NotionObjectTree,
  databaseIsRootLevel: boolean,
  layoutStrategy: LayoutStrategy,
  filesManager: FilesManager
) {
  const nodeAction = (
    objectResponse: NotionObjectResponse,
    parentContext: {
      path: string
      databaseIsRoot: boolean
    }
  ) => {
    if (objectResponse.object == "block") {
      // TODO: Handle block objects
      return parentContext
    }

    const notionObject = getNotionObject(objectResponse)
    // TODO: hanlde image paths here too
    if (notionObject instanceof NotionImage) {
      return parentContext
    }

    const newLevelPath = !parentContext.databaseIsRoot
      ? layoutStrategy.newLevel(parentContext.path, notionObject)
      : parentContext.path
    const objectPath =
      notionObject.object == "database"
        ? newLevelPath
        : layoutStrategy.getPathForPage(notionObject, parentContext.path)
    filesManager.set("base", notionObject.object, notionObject.id, {
      path: objectPath,
      lastEditedTime: notionObject.lastEditedTime,
    })
    return {
      path: newLevelPath,
      databaseIsRoot: false,
    }
  }
  objectsTree.traverse(nodeAction, {
    path: currentPath,
    databaseIsRoot: databaseIsRootLevel,
  })
}

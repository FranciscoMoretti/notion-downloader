import { NotionObjectTreeNode } from "notion-downloader"

import { FilesManager } from "./FilesManager"
import { LayoutStrategy } from "./LayoutStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"
import { NotionObjectsData } from "./objects_utils"
import { traverseTree } from "./traverseTree"

export async function getFileTreeMap(
  currentPath: string,
  objectsTreeNode: NotionObjectTreeNode,
  objectsData: NotionObjectsData,
  databaseIsRootLevel: boolean,
  layoutStrategy: LayoutStrategy,
  filesManager: FilesManager
): Promise<void> {
  if (objectsTreeNode.object == "block") {
    // TODO: Handle block objects and make notionObject never undefined
    return
  }
  const nodeAction = (
    notionObject: NotionDatabase | NotionPage,
    parentContext: {
      path: string
      databaseIsRoot: boolean
    }
  ) => {
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
  traverseTree(
    {
      path: currentPath,
      databaseIsRoot: databaseIsRootLevel,
    },
    objectsTreeNode,
    objectsData,
    nodeAction
  )
}

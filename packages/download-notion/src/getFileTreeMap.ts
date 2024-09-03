import { NotionObjectTreeNode } from "notion-downloader"

import { FilesManager } from "./FilesManager"
import { LayoutStrategy } from "./LayoutStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"
import { NotionObjectsData } from "./objects_utils"

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
  const notionObject = getNotionObject(
    objectsData,
    objectsTreeNode.id,
    objectsTreeNode.object
  )

  // Non-traversal logic start
  const newLevelPath = !databaseIsRootLevel
    ? layoutStrategy.newLevel(currentPath, notionObject)
    : currentPath
  const objectPath =
    notionObject.object == "database"
      ? newLevelPath
      : layoutStrategy.getPathForPage(notionObject, currentPath)
  filesManager.set("base", notionObject.object, objectsTreeNode.id, {
    path: objectPath,
    lastEditedTime: notionObject.lastEditedTime,
  })
  // Non-traversal logic end

  for (const childObject of objectsTreeNode.children) {
    await getFileTreeMap(
      newLevelPath,
      childObject,
      objectsData,
      false,
      layoutStrategy,
      filesManager
    )
  }
}

export function getNotionObject(
  objectData: NotionObjectsData,
  currentID: string,
  type: "page" | "database"
) {
  if (type === "page") {
    return getNotionPage(objectData, currentID)
  } else if (type === "database") {
    return getNotionDatabase(objectData, currentID)
  } else {
    throw new Error(`Unknown object type: ${type}`)
  }
}

export function getNotionPage(
  objectsData: NotionObjectsData,
  currentID: string
) {
  const pageResponse = objectsData.page[currentID]
  return new NotionPage(pageResponse)
}
export function getNotionDatabase(
  objectsData: NotionObjectsData,
  currentID: string
) {
  const databaseResponse = objectsData.database[currentID]
  return new NotionDatabase(databaseResponse)
}

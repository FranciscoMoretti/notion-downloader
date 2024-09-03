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
  const currentType = objectsTreeNode.object
  const currentID = objectsTreeNode.id
  if (currentType === "database") {
    const database = getNotionDatabase(objectsData, currentID)
    const newLevelPath = !databaseIsRootLevel
      ? layoutStrategy.newLevel(currentPath, database)
      : currentPath
    filesManager.set("base", "database", currentID, {
      path: newLevelPath,
      lastEditedTime: database.lastEditedTime,
    })

    // Recurse to children
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
  } else if (currentType === "page") {
    const page = await getNotionPage(objectsData, currentID)
    filesManager.set("base", "page", currentID, {
      path: layoutStrategy.getPathForPage(page, currentPath),
      lastEditedTime: page.lastEditedTime,
    })

    // TODO: Also handle blocks that have block/page children (e.g. columns)
    // Recurse to children
    if (objectsTreeNode.children.length > 0) {
      const newLevelPath = layoutStrategy.newLevel(currentPath, page)
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

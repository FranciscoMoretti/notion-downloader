import { NotionObjectTreeNode } from "notion-downloader"

import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"
import { NotionObjectsData } from "./objects_utils"

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

export async function traverseTree<T>(
  parentContext: T,
  objectsTreeNode: NotionObjectTreeNode,
  objectsData: NotionObjectsData,
  nodeAction: (notionObject: NotionDatabase | NotionPage, parentContext: T) => T
): Promise<void> {
  if (objectsTreeNode.object == "block") {
    // TODO: Handle block objects
    return
  }

  const notionObject = getNotionObject(
    objectsData,
    objectsTreeNode.id,
    objectsTreeNode.object
  )

  // Execute the node action and get the new context
  const newContext = nodeAction(notionObject, parentContext)

  for (const childObject of objectsTreeNode.children) {
    await traverseTree(newContext, childObject, objectsData, nodeAction)
  }
}

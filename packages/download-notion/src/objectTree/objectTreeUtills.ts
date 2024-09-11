import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionCacheClient } from "notion-cache-client"
import {
  IdWithType,
  NotionObjectResponse,
  NotionObjectTree,
  NotionObjectTreeNode,
  NotionObjectsData,
  objectTreeToObjectIds,
} from "notion-downloader"

export type PlainObjectsMap = Record<
  string,
  PageObjectResponse | DatabaseObjectResponse | BlockObjectResponse
>

export async function getObjectTypeFromClient(
  client: NotionCacheClient,
  idWithType: IdWithType
) {
  if (idWithType.type === "page_id") {
    return (await client.pages.retrieve({
      page_id: idWithType.page_id,
    })) as PageObjectResponse
  }
  if (idWithType.type === "database_id") {
    return (await client.databases.retrieve({
      database_id: idWithType.database_id,
    })) as DatabaseObjectResponse
  }
  if (idWithType.type === "block_id") {
    return (await client.blocks.retrieve({
      block_id: idWithType.block_id,
    })) as BlockObjectResponse
  }
}

// TODO: Consider a "build Object Tree" method with a generic `Client` interface
export async function getAllObjectsInObjectsTree(
  objectsTree: NotionObjectTreeNode,
  client: NotionCacheClient
) {
  const objectsIdsWithType: IdWithType[] = objectTreeToObjectIds(objectsTree)

  const objects: NotionObjectsData = {
    page: {},
    database: {},
    block: {},
  }
  for (const idWithType of objectsIdsWithType) {
    const object = await getObjectTypeFromClient(client, idWithType)
    if (!object) {
      throw new Error(`Object not found: ${idWithType}`)
    }
    addObjectToData(object, objects)

    // For blocks that contain a child page or child database, their responses have to be added as well
    if (
      object.object === "block" &&
      (object.type === "child_page" || object.type === "child_database")
    ) {
      const idType = object.type === "child_page" ? "page_id" : "database_id"
      const idWithType: IdWithType =
        idType === "page_id"
          ? {
              type: idType,
              page_id: object.id,
            }
          : {
              type: "database_id",
              database_id: object.id,
            }
      const adjacentObject = await getObjectTypeFromClient(client, idWithType)
      if (!adjacentObject) {
        throw new Error(`Child page not found: ${object.id}`)
      }
      addObjectToData(adjacentObject, objects)
    }
  }
  return objects
}

function addObjectToData(
  object: PageObjectResponse | DatabaseObjectResponse | BlockObjectResponse,
  objects: NotionObjectsData
) {
  if (object.object === "page") {
    objects.page[object.id] = object
  } else if (object.object === "database") {
    objects.database[object.id] = object
  } else if (object.object === "block") {
    objects.block[object.id] = object
  }
}

export function getPageAncestorId(
  objectType: "page" | "database" | "block",
  id: string,
  objectTree: NotionObjectTree
) {
  const parent = objectTree.getParent(objectType, id)
  if (!parent) {
    return null
  }
  const parentObject = objectTree.getObject(parent.object, parent.id)
  if (!parentObject) {
    return null
  }

  if (parentObject.object === "page") {
    return parentObject.id
  }
  if (parentObject.object === "database") {
    return getPageAncestorId("database", parentObject.id, objectTree)
  }
  if (parentObject.object === "block") {
    return getPageAncestorId("block", parentObject.id, objectTree)
  }
}

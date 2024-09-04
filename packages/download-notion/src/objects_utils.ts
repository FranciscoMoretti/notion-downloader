import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionCacheClient } from "notion-cache-client"
import {
  IdWithType,
  NotionObjectTree,
  NotionObjectTreeNode,
  NotionObjectsData,
  objectTreeToObjectIds,
} from "notion-downloader"

export type PlainObjectsMap = Record<
  string,
  PageObjectResponse | DatabaseObjectResponse | BlockObjectResponse
>

export function objectsToObjectsMap(objects: {
  page: Record<string, PageObjectResponse>
  database: Record<string, DatabaseObjectResponse>
  block: Record<string, BlockObjectResponse>
}): PlainObjectsMap {
  return Object.values(objects).reduce((acc, object) => {
    Object.entries(object).forEach(([id, object]) => {
      acc[id] = object
    })
    return acc
  }, {})
}

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
    if (object.object === "page") {
      objects.page[object.id] = object
    } else if (object.object === "database") {
      objects.database[object.id] = object
    } else if (object.object === "block") {
      objects.block[object.id] = object
    }
  }
  return objects
}

export function getPageAncestorId(id: string, objectTree: NotionObjectTree) {
  const parentId = objectTree.getParentId(id)
  if (!parentId) {
    return null
  }
  const parent = objectTree.getObject(parentId)
  if (!parent) {
    return null
  }

  if (parent.object === "page") {
    return parent.id
  }
  if (parent.object === "database") {
    return getPageAncestorId(parent.id, objectTree)
  }
  if (parent.object === "block") {
    return getPageAncestorId(parent.id, objectTree)
  }
}

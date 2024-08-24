import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionCacheClient } from "notion-cache-client"
import {
  IdWithType,
  NotionObjectTreeNode,
  objectTreeToObjectIds,
} from "notion-downloader"

export function objectsToObjectsMap(objects: {
  page: Record<string, PageObjectResponse>
  database: Record<string, DatabaseObjectResponse>
  block: Record<string, BlockObjectResponse>
}) {
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

export async function getAllObjectsInObjectsTree(
  objectsTree: NotionObjectTreeNode,
  client: NotionCacheClient
) {
  const objectsIdsWithType: IdWithType[] = objectTreeToObjectIds(objectsTree)
  const objects: {
    page: Record<string, PageObjectResponse>
    database: Record<string, DatabaseObjectResponse>
    block: Record<string, BlockObjectResponse>
  } = {
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

type ObjectsMap = Record<
  string,
  PageObjectResponse | DatabaseObjectResponse | BlockObjectResponse
>

export function getPageAncestorId(id: string, flatObjectsMap: ObjectsMap) {
  const parent = flatObjectsMap[id]?.parent
  if (!parent || parent.type === "workspace") {
    return null
  }
  if (parent.type === "page_id") {
    return parent.page_id
  }
  if (parent.type === "database_id") {
    return getPageAncestorId(parent.database_id, flatObjectsMap)
  }
  if (parent.type === "block_id") {
    return getPageAncestorId(parent.block_id, flatObjectsMap)
  }
}

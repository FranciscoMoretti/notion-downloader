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

import { NotionBlockImage } from "./NotionBlockImage"
import { NotionCoverImage } from "./NotionCoverImage"
import { NotionImageLike } from "./objectTypes"
import { databaseHasCover, pageHasCover } from "./processImages"

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

export function hasImageLikeObject(notionObject: NotionObjectResponse) {
  if (notionObject.object === "block" && notionObject.type === "image") {
    return true
  }
  if (notionObject.object === "page" && notionObject.cover) {
    return true
  }
  if (notionObject.object === "database" && notionObject.cover) {
    return true
  }

  return false
}

export function getImageLikeObject(
  notionObject: NotionObjectResponse
): NotionImageLike {
  if (notionObject.object === "block" && notionObject.type === "image") {
    return new NotionBlockImage(notionObject)
  }
  if (notionObject.object === "page") {
    if (pageHasCover(notionObject)) {
      return new NotionCoverImage(notionObject)
    }
  }
  if (notionObject.object === "database") {
    if (databaseHasCover(notionObject)) {
      return new NotionCoverImage(notionObject)
    }
  }

  throw new Error(`No image like object found for ${notionObject.object}`)
}

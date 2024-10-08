import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionCacheClient, ObjectType } from "notion-cache-client"

import { NotionObjectTreeNode, NotionObjectsData } from "./notion-object-tree"
import { IdWithType, objectTreeToObjectIds } from "./object-tree-utils"

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
      object.object === ObjectType.enum.block &&
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
  if (object.object === ObjectType.enum.page) {
    objects.page[object.id] = object
  } else if (object.object === ObjectType.enum.database) {
    objects.database[object.id] = object
  } else if (object.object === ObjectType.enum.block) {
    objects.block[object.id] = object
  }
}

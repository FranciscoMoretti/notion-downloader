import { ObjectType } from "notion-cache-client"

import {
  NotionObjectPlain,
  NotionObjectPlainList,
  NotionObjectTreeNode,
} from "./notion-object-tree"

export type IdWithType =
  | { page_id: string; type: "page_id" }
  | { database_id: string; type: "database_id" }
  | { block_id: string; type: "block_id" }

// TODO: Plan objects should be divided by object type (page, database, block). Ids can be repeated across object types
export function objectTreeToPlainObjects(
  objectTree: NotionObjectTreeNode
): NotionObjectPlainList {
  const nodes: Array<NotionObjectPlain> = []
  function recurse(node: NotionObjectTreeNode) {
    // Children should only be kept as ids
    const newNode = {
      ...node,
      children: node.children.map((child) => child.id),
    }
    nodes.push(newNode)
    for (const child of node.children) {
      recurse(child)
    }
  }
  recurse(objectTree)
  return nodes
}

export function objectTreeToObjectIds(
  objectTree: NotionObjectTreeNode
): IdWithType[] {
  // Gets the page ids, the database ids and the block ids of an object tree
  const ids: IdWithType[] = []
  const plainObjects = objectTreeToPlainObjects(objectTree)
  plainObjects.forEach((node) => {
    if (node.object === ObjectType.Page) {
      ids.push({ page_id: node.id, type: "page_id" })
    } else if (node.object === ObjectType.Database) {
      ids.push({ database_id: node.id, type: "database_id" })
    } else if (node.object === ObjectType.Block) {
      ids.push({ block_id: node.id, type: "block_id" })
      if (node.type === "child_database") {
        ids.push({ database_id: node.id, type: "database_id" })
      } else if (node.type === "child_page") {
        ids.push({ page_id: node.id, type: "page_id" })
      }
    }
  })
  return ids
}

export function idTypeToObjectType(idWithType: IdWithType["type"]): ObjectType {
  if (idWithType === "page_id") {
    return ObjectType.Page
  }
  if (idWithType === "database_id") {
    return ObjectType.Database
  }
  if (idWithType === "block_id") {
    return ObjectType.Block
  }
  throw new Error(`Invalid id type: ${idWithType}`)
}

export function idFromIdWithType(idWithType: IdWithType): string {
  if (idWithType.type == "database_id") {
    return idWithType.database_id
  } else if (idWithType.type == "page_id") {
    return idWithType.page_id
  } else if (idWithType.type == "block_id") {
    return idWithType.block_id
  }
  throw new Error(`Unknown type for id with type ${idWithType}`)
}

export function groupIdsByType(
  idsWithType: IdWithType[]
): Record<"database_id" | "page_id" | "block_id", string[]> {
  return idsWithType.reduce<
    Record<"database_id" | "page_id" | "block_id", string[]>
  >(
    (acc, idWithType) => {
      acc[idWithType.type].push(idFromIdWithType(idWithType))
      return acc
    },
    { database_id: [], page_id: [], block_id: [] }
  )
}

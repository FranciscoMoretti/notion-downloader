import { NotionObjectTreeNode } from "./notion-object-tree"

type IdWithType =
  | { page_id: string; type: "page_id" }
  | { database_id: string; type: "database_id" }
  | { block_id: string; type: "block_id" }

export function objectTreeToObjectIds(
  objectTree: NotionObjectTreeNode
): IdWithType[] {
  // Gets the page ids, the database ids and the block ids of an object tree
  const ids: IdWithType[] = []
  function recurse(node: NotionObjectTreeNode) {
    if (node.object === "page") {
      ids.push({ page_id: node.id, type: "page_id" })
    } else if (node.object === "database") {
      ids.push({ database_id: node.id, type: "database_id" })
    } else if (node.object === "block") {
      ids.push({ block_id: node.id, type: "block_id" })
      if (node.type === "child_database") {
        ids.push({ database_id: node.id, type: "database_id" })
      } else if (node.type === "child_page") {
        ids.push({ page_id: node.id, type: "page_id" })
      }
    }
    for (const child of node.children) {
      recurse(child)
    }
  }
  recurse(objectTree)
  return ids
}

function idFromIdWithType(idWithType: IdWithType): string {
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

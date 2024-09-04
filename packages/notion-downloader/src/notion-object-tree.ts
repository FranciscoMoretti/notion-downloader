import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

export type NotionObjectResponse =
  | PageObjectResponse
  | DatabaseObjectResponse
  | BlockObjectResponse

export type NotionObjectsData = {
  page: Record<string, PageObjectResponse>
  database: Record<string, DatabaseObjectResponse>
  block: Record<string, BlockObjectResponse>
}

export type BlockObjectTreeNode = {
  id: string
  object: "block"
  type: string
  has_children: boolean
  children: Array<NotionObjectTreeNode>
  parent: string | null
}

// TODO: Mix this with ObjectsData in a class to have a tree with data. There should be a mapping from id to treeNode
export type NotionObjectTreeNode =
  | {
      id: string
      object: "database" | "page"
      children: Array<NotionObjectTreeNode>
      parent: string | null
    }
  | BlockObjectTreeNode

export type NotionObjectPlain =
  | {
      id: string
      object: "database" | "page"
      children: Array<string>
      parent: string | null
    }
  | {
      id: string
      object: "block"
      type: string
      has_children: boolean
      children: Array<string>
      parent: string | null
    }
export type NotionObjectPlainList = NotionObjectPlain[]
export type NotionObjectPlainMap = Record<string, NotionObjectPlain>

export class NotionObjectTree {
  private data: NotionObjectsData // Responses from Notion API
  private tree: NotionObjectTreeNode // Tree structure
  private idToNodeMap: Map<string, NotionObjectTreeNode> = new Map()

  constructor(rootNode: NotionObjectTreeNode, initialData: NotionObjectsData) {
    this.tree = rootNode
    this.data = initialData
    this.buildIdToNodeMap(rootNode)
  }

  private buildIdToNodeMap(node: NotionObjectTreeNode) {
    this.idToNodeMap.set(node.id, node)
    for (const child of node.children) {
      this.buildIdToNodeMap(child)
    }
  }

  // TODO: Consider doing the get operations starting from a specific node
  getPages(): PageObjectResponse[] {
    return Object.values(this.data.page)
  }

  getDatabases(): DatabaseObjectResponse[] {
    return Object.values(this.data.database)
  }

  getBlocks(): BlockObjectResponse[]
  getBlocks<T extends BlockObjectResponse["type"]>(
    type: T
  ): Extract<BlockObjectResponse, { type: T }>[]
  getBlocks(type?: string): BlockObjectResponse[] {
    if (type) {
      return Object.values(this.data.block).filter(
        (block): block is Extract<BlockObjectResponse, { type: typeof type }> =>
          block.type === type
      )
    }
    return Object.values(this.data.block)
  }

  traverse<T>(
    nodeAction: (
      objectResponse: NotionObjectResponse,
      parentContext: T,
      tree: NotionObjectTree
    ) => T,
    parentContext: T,
    startNode: NotionObjectTreeNode = this.tree
  ) {
    const objectResponse = this.data[startNode.object][startNode.id]
    if (!objectResponse) {
      throw new Error(`Object response not found for id: ${startNode.id}`)
    }
    const newContext = nodeAction(objectResponse, parentContext, this)

    for (const child of startNode.children) {
      this.traverse(nodeAction, newContext, child)
    }
  }

  getNodeById(id: string): NotionObjectTreeNode | undefined {
    return this.idToNodeMap.get(id)
  }

  addObject(
    object: PageObjectResponse | DatabaseObjectResponse | BlockObjectResponse
  ) {
    const { id, object: objectType } = object

    // Add to data
    this.data[objectType][id] = object

    // Add to tree
    const parentId = getParentId(object.parent)
    if (!parentId) {
      throw new Error("Parent id not found")
    }

    const parentNode = this.getNodeById(parentId)
    if (!parentNode) {
      throw new Error("Parent node not found")
    }
    const newNode: NotionObjectTreeNode =
      objectType === "block"
        ? {
            id,
            object: objectType,
            children: [],
            parent: parentId,
            type: object.type,
            has_children: object.has_children,
          }
        : {
            id,
            object: objectType,
            children: [],
            parent: parentId,
          }
    parentNode.children.push(newNode)
    // Add to mapping
    this.idToNodeMap.set(id, newNode)
  }

  getParentId(id: string): string | null {
    const node = this.getNodeById(id)
    if (!node) return null
    return node.parent
  }

  getObject(
    id: string
  ):
    | PageObjectResponse
    | DatabaseObjectResponse
    | BlockObjectResponse
    | undefined {
    const node = this.getNodeById(id)
    if (!node) return undefined
    return this.data[node.object][id]
  }

  removeObject(id: string) {
    const node = this.getNodeById(id)
    if (!node) return
    // First let children remove themselves, and then remove up to the start node
    for (const child of node.children) {
      this.removeObject(child.id)
    }
    // Delete from data
    delete this.data[node.object][id]
    // Delete from tree
    const parentId = node.parent
    if (parentId) {
      const parentNode = this.getNodeById(parentId)
      if (!parentNode) return
      parentNode.children = parentNode.children.filter(
        (child) => child.id !== id
      )
    }
    // Delete from mapping
    this.idToNodeMap.delete(id)
  }
}

export function getParentId(
  parent:
    | PageObjectResponse["parent"]
    | DatabaseObjectResponse["parent"]
    | BlockObjectResponse["parent"]
) {
  if (parent.type === "workspace") {
    return null
  } else if (parent.type === "page_id") {
    return parent.page_id
  } else if (parent.type === "database_id") {
    return parent.database_id
  } else if (parent.type === "block_id") {
    return parent.block_id
  } else {
    throw new Error(`Unknown parent type: ${parent}`)
  }
}

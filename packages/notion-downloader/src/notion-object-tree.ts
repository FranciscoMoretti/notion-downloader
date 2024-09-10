import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { simplifyParentObject } from "notion-cache-client"

export type NotionObjectResponse =
  | PageObjectResponse
  | DatabaseObjectResponse
  | BlockObjectResponse

export type NotionObjectsData = {
  page: Record<string, PageObjectResponse>
  database: Record<string, DatabaseObjectResponse>
  block: Record<string, BlockObjectResponse>
}

type IdToNodeMap = {
  page: Map<string, NotionObjectTreeNode>
  database: Map<string, NotionObjectTreeNode>
  block: Map<string, NotionObjectTreeNode>
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
      // TODO: Deprecate the parent string. It's not enough to id the parent because the type is needed too
      parent: string | null
    }
  | BlockObjectTreeNode

export type NotionObjectPlain =
  | {
      id: string
      object: "database" | "page"
      children: Array<string>
      // TODO: Deprecate the parent string. It's not enough to id the parent because the type is needed too
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
  private idToNodeMap: IdToNodeMap = {
    page: new Map(),
    database: new Map(),
    block: new Map(),
  }

  constructor(rootNode: NotionObjectTreeNode, initialData: NotionObjectsData) {
    this.tree = rootNode
    this.data = initialData
    this.buildIdToNodeMap(rootNode)
  }

  private buildIdToNodeMap(node: NotionObjectTreeNode) {
    this.idToNodeMap[node.object].set(node.id, node)
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

  addObject(
    object: PageObjectResponse | DatabaseObjectResponse | BlockObjectResponse
  ) {
    const { id, object: objectType } = object

    // Add to data
    this.data[objectType][id] = object

    // Add to tree
    const parent = simplifyParentObject(object.parent)
    if (!parent) {
      throw new Error("Parent not found")
    }

    const parentNode = this.getNodeById(parent.object, parent.id)
    if (!parentNode) {
      throw new Error("Parent node not found")
    }
    const newNode: NotionObjectTreeNode =
      objectType === "block"
        ? {
            id,
            object: objectType,
            children: [],
            parent: parent.id,
            type: object.type,
            has_children: object.has_children,
          }
        : {
            id,
            object: objectType,
            children: [],
            parent: parent.id,
          }
    parentNode.children.push(newNode)
    // Add to mapping
    this.idToNodeMap[objectType].set(id, newNode)
  }

  getParentId(
    objectType: "page" | "database" | "block",
    id: string
  ): string | null {
    const node = this.getNodeById(objectType, id)
    if (!node) return null
    return node.parent
  }

  getObject(
    objectType: "page" | "database" | "block",
    id: string
  ): PageObjectResponse | DatabaseObjectResponse | BlockObjectResponse {
    const objectData = this.data[objectType][id]
    if (!objectData) {
      throw new Error(
        `Object response not found for id: ${id} and type: ${objectType}`
      )
    }
    return objectData
  }

  removeObject(objectType: "page" | "database" | "block", id: string) {
    const node = this.getNodeById(objectType, id)
    if (!node) return
    // First let children remove themselves, and then remove up to the start node
    for (const child of node.children) {
      this.removeObject(objectType, child.id)
    }
    // Delete from data
    const parentRaw = { ...this.data[node.object][id].parent }
    delete this.data[node.object][id]
    // Delete from tree
    const parent = simplifyParentObject(parentRaw)
    if (parent) {
      const parentNode = this.getNodeById(parent.object, parent.id)
      if (!parentNode) return
      parentNode.children = parentNode.children.filter(
        (child) => child.id !== id
      )
    }
    // Delete from mapping
    this.idToNodeMap[objectType].delete(id)
  }

  private getNodeById(
    objectType: "page" | "database" | "block",
    id: string
  ): NotionObjectTreeNode | undefined {
    return this.idToNodeMap[objectType].get(id)
  }
}

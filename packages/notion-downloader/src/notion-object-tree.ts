import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import {
  ObjectType,
  SimpleParent,
  simplifyParentObject,
} from "notion-cache-client"

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
  block: Map<string, BlockObjectTreeNode>
}

export type BlockObjectTreeNode = {
  id: string
  object: ObjectType.Block
  type: string
  has_children: boolean
  children: Array<NotionObjectTreeNode>
  parent: SimpleParent | null
}

// TODO: Mix this with ObjectsData in a class to have a tree with data. There should be a mapping from id to treeNode
export type NotionObjectTreeNode =
  | {
      id: string
      object: ObjectType.Page | ObjectType.Database
      children: Array<NotionObjectTreeNode>
      parent: SimpleParent | null
    }
  | BlockObjectTreeNode

export type NotionObjectPlain =
  | {
      id: string
      object: ObjectType.Database | ObjectType.Page
      children: Array<string>
      parent: SimpleParent | null
    }
  | {
      id: string
      object: ObjectType.Block
      type: string
      has_children: boolean
      children: Array<string>
      parent: SimpleParent | null
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
    this.setNodetoMap(node)
    for (const child of node.children) {
      this.buildIdToNodeMap(child)
    }
  }

  private setNodetoMap(node: NotionObjectTreeNode) {
    if (node.object === ObjectType.Block) {
      this.idToNodeMap.block.set(node.id, node)
    } else {
      this.idToNodeMap[node.object].set(node.id, node)
    }
  }

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

  getParent(objectType: ObjectType, id: string): SimpleParent | null {
    const node = this.getNodeById(objectType, id)
    if (!node) return null
    if (node.id === this.tree.id) {
      // Parent higher than root
      return null
    }
    return node.parent
  }

  getObject(
    objectType: ObjectType,
    id: string
  ):
    | PageObjectResponse
    | DatabaseObjectResponse
    | BlockObjectResponse
    | undefined {
    const objectData = this.data[objectType][id]
    return objectData || undefined
  }

  removeObject(objectType: ObjectType, id: string) {
    const node = this.getNodeById(objectType, id)
    if (!node) return
    // First let children remove themselves, and then remove up to the start node
    for (const child of node.children) {
      this.removeObject(child.object, child.id)
    }
    // Save parent before deleting
    const parentRaw = { ...this.data[node.object][id].parent }
    // Delete from data
    delete this.data[node.object][id]
    if (node.object === ObjectType.Block && node.type === "child_page") {
      delete this.data.page[id]
    } else if (
      node.object === ObjectType.Block &&
      node.type === "child_database"
    ) {
      delete this.data.database[id]
    }

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
    objectType: ObjectType,
    id: string
  ): NotionObjectTreeNode | undefined {
    // If asked for a page or database, child_page and child_database have presedence over pages and databases
    if (objectType === ObjectType.Page) {
      const possible_child_page = this.idToNodeMap.block.get(id)
      if (possible_child_page) {
        if (possible_child_page.type === "child_page") {
          return possible_child_page
        } else {
          throw new Error(`Block with id ${id} exists but is not a child page`)
        }
      }
    } else if (objectType === ObjectType.Database) {
      const possible_child_database = this.idToNodeMap.block.get(id)
      if (possible_child_database) {
        if (possible_child_database.type === "child_database") {
          return possible_child_database
        } else {
          throw new Error(
            `Block with id ${id} exists but is not a child database`
          )
        }
      }
    }

    return this.idToNodeMap[objectType].get(id)
  }
}

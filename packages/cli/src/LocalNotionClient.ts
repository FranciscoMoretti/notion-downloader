import { Client } from "@notionhq/client"
import {
  GetBlockParameters,
  GetBlockResponse,
  GetDatabaseParameters,
  GetDatabaseResponse,
  GetPageParameters,
  GetPageResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints"

import {
  NotionObjectTreeNode,
  NotionObjectsCache,
} from "./notion-structures-types"

export class LocalNotionClient extends Client {
  objectsCache: NotionObjectsCache
  objectsTree: NotionObjectTreeNode
  notionClient: Client

  constructor(
    objectsCache: NotionObjectsCache,
    objectsTree: NotionObjectTreeNode,
    auth: string
  ) {
    super({
      auth: auth,
    })
    this.objectsCache = objectsCache
    this.objectsTree = objectsTree
    this.notionClient = new Client({ auth })
  }

  // TODO: fix type annotations by only making get methods available or wrap the rest of the methods
  public readonly blocks = {
    /**
     * Retrieve block
     */
    retrieve: (args: GetBlockParameters): Promise<GetBlockResponse> => {
      return this.notionClient.blocks.retrieve(args)
    },

    /**
     * Retrieve block children
     */
    children: {
      list: (
        args: ListBlockChildrenParameters
      ): Promise<ListBlockChildrenResponse> => {
        return this.notionClient.blocks.children.list(args)
      },
    },
  }

  // TODO: fix type annotations by only making get methods available or wrap the rest of the methods
  public readonly pages = {
    /**
     * Retrieve page
     */
    retrieve: (args: GetPageParameters): Promise<GetPageResponse> => {
      return this.notionClient.pages.retrieve(args)
    },
  }

  // TODO: fix type annotations by only making get methods available or wrap the rest of the methods
  public readonly databases = {
    /**
     * Retrieve database
     */
    retrieve: (args: GetDatabaseParameters): Promise<GetDatabaseResponse> => {
      return this.notionClient.databases.retrieve(args)
    },

    query: (args: QueryDatabaseParameters): Promise<QueryDatabaseResponse> => {
      return this.notionClient.databases.query(args)
    },
  }
}

import { Client } from "@notionhq/client"
import {
  DatabaseObjectResponse,
  GetBlockParameters,
  GetBlockResponse,
  GetDatabaseParameters,
  GetDatabaseResponse,
  GetPageParameters,
  GetPageResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  PageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints"

import {
  DatabaseChildrenCache,
  NotionObjectTreeNode,
  NotionObjectsCache,
} from "./notion-structures-types"

export class LocalNotionClient extends Client {
  objectsCache: NotionObjectsCache
  objectsTree: NotionObjectTreeNode
  databaseChildrenCache: DatabaseChildrenCache
  notionClient: Client

  constructor({
    objectsCache,
    objectsTree,
    databaseChildrenCache,
    auth,
  }: {
    objectsCache: NotionObjectsCache
    objectsTree: NotionObjectTreeNode
    databaseChildrenCache: DatabaseChildrenCache
    auth: string
  }) {
    super({
      auth: auth,
    })
    this.objectsCache = objectsCache
    this.objectsTree = objectsTree
    this.databaseChildrenCache = databaseChildrenCache
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
      // Check if we have it in cache
      if (this.databaseChildrenCache[args.database_id]) {
        // We have it in cache
        const childrenIds =
          this.databaseChildrenCache[args.database_id].children
        const results = childrenIds
          .map((id) => this.objectsCache[id])
          .filter(Boolean) as PageObjectResponse[] | DatabaseObjectResponse[]
        if (results.length !== childrenIds.length) {
          console.log(
            `LocalNotionClient: Database children not found in cache.`
          )
          throw Error(
            "Inconsistent state: Database children not found in cache."
          )
        }

        const response: QueryDatabaseResponse = {
          type: "page_or_database",
          page_or_database: {},
          object: "list",
          next_cursor: null,
          has_more: false,
          results: results,
        }

        return Promise.resolve(response)
      }
      // Fallback to calling API
      return this.notionClient.databases.query(args)
      // TODO: Add saving to database here
    },
  }
}

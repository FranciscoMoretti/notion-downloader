import {
  Client,
  isFullBlock,
  isFullDatabase,
  isFullPage,
  isFullPageOrDatabase,
} from "@notionhq/client"
import {
  BlockObjectRequest,
  BlockObjectResponse,
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

import { executeWithRateLimitAndRetries } from "./executeWithRateLimitAndRetries"
import {
  BlocksChildrenCache,
  DatabaseChildrenCache,
  NotionObjectTreeNode,
  NotionObjectsCache,
} from "./notion-structures-types"

export class LocalNotionClient extends Client {
  objectsCache: NotionObjectsCache
  databaseChildrenCache: DatabaseChildrenCache
  blocksChildrenCache: BlocksChildrenCache
  notionClient: Client

  constructor({
    auth,
    objectsCache,
    databaseChildrenCache,
    blocksChildrenCache,
  }: {
    auth: string
    objectsCache?: NotionObjectsCache
    databaseChildrenCache?: DatabaseChildrenCache
    blocksChildrenCache?: BlocksChildrenCache
  }) {
    super({
      auth: auth,
    })
    this.notionClient = new Client({ auth })
    this.objectsCache = objectsCache || {}
    this.databaseChildrenCache = databaseChildrenCache || {}
    this.blocksChildrenCache = blocksChildrenCache || {}
  }
  // TODO: Split object caches into page/block/database objects caches

  // TODO: fix type annotations by only making get methods available or wrap the rest of the methods
  public readonly blocks = {
    /**
     * Retrieve block
     */
    retrieve: (args: GetBlockParameters): Promise<GetBlockResponse> => {
      // Check if we have it in cache
      if (this.objectsCache[args.block_id]) {
        // We have it in cache
        // TODO: Do type narrowing and validation instead of casting
        console.log("Retrieved block from cache")
        return Promise.resolve(
          this.objectsCache[args.block_id] as GetBlockResponse
        )
      }
      console.log("Cache miss for block", args.block_id)
      return executeWithRateLimitAndRetries(
        `blocks.retrieve(${args.block_id})`,
        () => {
          return this.notionClient.blocks.retrieve(args)
        }
      ).then((response) => {
        // Saving to cache here
        console.log("Saving to cache block", args.block_id)
        if (!isFullBlock(response)) {
          throw Error(`Non full page: ${JSON.stringify(response)}`)
        }
        this.objectsCache[args.block_id] = response
        return response
      })
    },

    /**
     * Retrieve block children
     */
    children: {
      list: (
        args: ListBlockChildrenParameters
      ): Promise<ListBlockChildrenResponse> => {
        // Check if we have it in cache
        if (this.blocksChildrenCache[args.block_id]) {
          // We have it in cache
          const childrenIds = this.blocksChildrenCache[args.block_id].children
          const results = childrenIds
            .map((id) => this.objectsCache[id])
            .filter(Boolean) as BlockObjectResponse[]
          if (results.length !== childrenIds.length) {
            console.log(`LocalNotionClient: Block children not found in cache.`)
            throw Error(
              "Inconsistent state: Block children not found in cache."
            )
          }

          const response: ListBlockChildrenResponse = {
            type: "block",
            block: {},
            object: "list",
            next_cursor: null,
            has_more: false,
            results: results,
          }
          console.log("Retrieved block children query from cache")
          return Promise.resolve(response)
        }
        // Fallback to calling API
        console.log("Cache miss for block children", args.block_id)
        // TODO: Query on a while loop until no more pages available

        // TODO: Handle case in which options are used
        return executeWithRateLimitAndRetries(
          `blocks.children.list(${args.block_id})`,
          () => {
            return this.notionClient.blocks.children.list(args)
          }
        ).then((response) => {
          // Saving to cache here
          console.log("Saving to cache block", args.block_id)
          this.blocksChildrenCache[args.block_id] = {
            children: response.results.map((child) => child.id),
          }
          response.results.forEach((child) => {
            if (!isFullBlock(child)) {
              throw Error(`Non full block: ${JSON.stringify(response)}`)
            }
            this.objectsCache[child.id] = child
          })
          return response
        })
      },
    },
  }

  // TODO: fix type annotations by only making get methods available or wrap the rest of the methods
  public readonly pages = {
    /**
     * Retrieve page
     */
    retrieve: (args: GetPageParameters): Promise<GetPageResponse> => {
      // Check if we have it in cache
      if (this.objectsCache[args.page_id]) {
        // We have it in cache
        // TODO: Do type narrowing and validation instead of casting
        console.log("Retrieved page from cache")
        return Promise.resolve(
          this.objectsCache[args.page_id] as GetPageResponse
        )
      }
      console.log("Cache miss for page", args.page_id)
      return executeWithRateLimitAndRetries(
        `pages.retrieve(${args.page_id})`,
        () => {
          return this.notionClient.pages.retrieve(args)
        }
      ).then((response) => {
        // Saving to cache here
        console.log("Saving to cache page", args.page_id)
        if (!isFullPage(response)) {
          throw Error(`Non full page: ${JSON.stringify(response)}`)
        }
        this.objectsCache[args.page_id] = response
        return response
      })
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
        console.log("Retrieved database query from cache")
        return Promise.resolve(response)
      }
      // Fallback to calling API
      console.log("Cache miss for database query", args.database_id)
      // TODO: Query on a while loop until no more pages available

      // TODO: Handle case in which options are used
      return executeWithRateLimitAndRetries(
        `database.query(${args.database_id})`,
        () => {
          return this.notionClient.databases.query(args)
        }
      ).then((response) => {
        // Saving to database children cache
        this.databaseChildrenCache[args.database_id] = {
          children: response.results.map((child) => child.id),
        }
        response.results.forEach((child) => {
          if (!isFullPageOrDatabase(child)) {
            throw new Error(
              `Non full page or database: ${JSON.stringify(child)}`
            )
          }
          // Saving to objects cache
          this.objectsCache[child.id] = child
        })
        return response
      })
    },
  }
}

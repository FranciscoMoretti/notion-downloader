import { info } from "console"
import {
  Client,
  isFullBlock,
  isFullDatabase,
  isFullPage,
  isFullPageOrDatabase,
} from "@notionhq/client"
import {
  AppendBlockChildrenParameters,
  AppendBlockChildrenResponse,
  BlockObjectRequest,
  BlockObjectResponse,
  CreateDatabaseParameters,
  CreateDatabaseResponse,
  CreatePageParameters,
  CreatePageResponse,
  DatabaseObjectResponse,
  DeleteBlockParameters,
  DeleteBlockResponse,
  GetBlockParameters,
  GetBlockResponse,
  GetDatabaseParameters,
  GetDatabaseResponse,
  GetPageParameters,
  GetPagePropertyParameters,
  GetPagePropertyResponse,
  GetPageResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  ListDatabasesParameters,
  ListDatabasesResponse,
  PageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
  UpdateBlockParameters,
  UpdateBlockResponse,
  UpdateDatabaseParameters,
  UpdateDatabaseResponse,
  UpdatePageParameters,
  UpdatePageResponse,
} from "@notionhq/client/build/src/api-endpoints"

import { NotionCache, NotionCacheOptions } from "./NotionCache"
import { executeWithRateLimitAndRetries } from "./executeWithRateLimitAndRetries"
import { logOperation } from "./logOperation"
import { CacheType } from "./notion-structures-types"

export class NotionCacheClient extends Client {
  cache: NotionCache
  notionClient: Client

  constructor({
    auth,
    cacheOptions,
  }: {
    auth: string
    cacheOptions: NotionCacheOptions
  }) {
    super({
      auth: auth,
    })
    this.cache = new NotionCache(cacheOptions)
    this.notionClient = new Client({ auth })
  }

  public readonly blocks = {
    /**
     * Retrieve block
     */
    retrieve: (
      args: GetBlockParameters,
      level: number = 0
    ): Promise<GetBlockResponse> => {
      this.logClientMessage({
        resource_type: CacheType.BLOCK,
        source: "CLIENT",
        operation: "RETRIEVE",
        id: args.block_id,
        level: level,
      })
      // Check if we have it in cache
      const blockFromCache = this.cache.getBlock(args.block_id, level + 1)
      if (blockFromCache) {
        return Promise.resolve(blockFromCache)
      }

      return executeWithRateLimitAndRetries(
        `blocks.retrieve(${args.block_id})`,
        () => {
          this.logClientMessage({
            resource_type: CacheType.BLOCK,
            source: "NOTION",
            operation: "RETRIEVE",
            id: args.block_id,
            level: level + 1,
          })
          return this.notionClient.blocks.retrieve(args)
        }
      ).then((response) => {
        if (!isFullBlock(response)) {
          throw Error(`Non full page: ${JSON.stringify(response)}`)
        }
        this.cache.setBlock(response, level + 1)
        return response
      })
    },

    update: (args: UpdateBlockParameters): Promise<UpdateBlockResponse> => {
      return this.blocks.update(args)
    },

    delete: (args: DeleteBlockParameters): Promise<DeleteBlockResponse> => {
      return this.notionClient.blocks.delete(args)
    },

    /**
     * Retrieve block children
     */
    children: {
      append: (
        args: AppendBlockChildrenParameters
      ): Promise<AppendBlockChildrenResponse> => {
        return this.notionClient.blocks.children.append(args)
      },

      list: (
        args: ListBlockChildrenParameters,
        level: number = 0
      ): Promise<ListBlockChildrenResponse> => {
        // When args others than block_id are used, we default to the method from ancestor
        this.logClientMessage({
          resource_type: CacheType.BLOCKS_CHILDREN,
          source: "CLIENT",
          operation: "RETRIEVE",
          id: args.block_id,
          level: level,
        })
        if (Object.values(args).filter(Boolean).length > 1) {
          this.logClientMessage({
            resource_type: CacheType.BLOCKS_CHILDREN,
            source: "NOTION",
            operation: "RETRIEVE",
            id: args.block_id,
            level: level + 1,
          })
          return this.notionClient.blocks.children.list(args)
        }

        // Check if we have it in cache
        const childrenFromCache = this.cache.getBlockChildren(
          args.block_id,
          level + 1
        )
        if (childrenFromCache) {
          return Promise.resolve(childrenFromCache)
        }

        return executeWithRateLimitAndRetries(
          `blocks.children.list(${args.block_id})`,
          () => {
            this.logClientMessage({
              resource_type: CacheType.BLOCKS_CHILDREN,
              source: "NOTION",
              operation: "RETRIEVE",
              id: args.block_id,
              level: level + 1,
            })
            return this.notionClient.blocks.children.list(args)
          }
        ).then((response) => {
          this.cache.setBlockChildren(args.block_id, response, level + 1)
          return response
        })
      },
    },
  }

  public readonly databases = {
    list: (args: ListDatabasesParameters): Promise<ListDatabasesResponse> => {
      return this.notionClient.databases.list(args)
    },

    /**
     * Retrieve database
     */
    retrieve: (
      args: GetDatabaseParameters,
      level: number = 0
    ): Promise<GetDatabaseResponse> => {
      // Check if we have it in cache
      this.logClientMessage({
        resource_type: CacheType.DATABASE,
        source: "CLIENT",
        operation: "RETRIEVE",
        id: args.database_id,
        level: level,
      })
      const databaseFromCache = this.cache.getDatabase(
        args.database_id,
        level + 1
      )
      if (databaseFromCache) {
        return Promise.resolve(databaseFromCache)
      }
      return executeWithRateLimitAndRetries(
        `databases.retrieve(${args.database_id})`,
        () => {
          this.logClientMessage({
            resource_type: CacheType.DATABASE,
            source: "NOTION",
            operation: "RETRIEVE",
            id: args.database_id,
            level: level + 1,
          })
          return this.notionClient.databases.retrieve(args)
        }
      ).then((response) => {
        // Saving to cache here
        if (!isFullDatabase(response)) {
          throw Error(`Non full database: ${JSON.stringify(response)}`)
        }
        this.cache.setDatabase(response, level + 1)
        return response
      })
    },

    query: (
      args: QueryDatabaseParameters,
      level: number = 0
    ): Promise<QueryDatabaseResponse> => {
      // When args others than block_id are used, we default to the method from ancestor
      this.logClientMessage({
        resource_type: CacheType.DATABASE_CHILDREN,
        source: "CLIENT",
        operation: "RETRIEVE",
        id: args.database_id,
        level,
      })
      if (Object.values(args).filter(Boolean).length > 1) {
        this.logClientMessage({
          resource_type: CacheType.DATABASE_CHILDREN,
          source: "NOTION",
          operation: "RETRIEVE",
          id: args.database_id,
          level: level + 1,
        })
        return this.notionClient.databases.query(args)
      }
      const databaseChildrenFromCache = this.cache.getDatabaseChildren(
        args.database_id,
        level + 1
      )
      if (databaseChildrenFromCache) {
        return Promise.resolve(databaseChildrenFromCache)
      }

      return executeWithRateLimitAndRetries(
        `database.query(${args.database_id})`,
        () => {
          this.logClientMessage({
            resource_type: CacheType.DATABASE_CHILDREN,
            source: "NOTION",
            operation: "RETRIEVE",
            id: args.database_id,
            level: level + 1,
          })
          return this.notionClient.databases.query(args)
        }
      ).then((response) => {
        // Saving to database children cache
        this.cache.setDatabaseChildren(args.database_id, response, level + 1)
        return response
      })
    },

    create: (
      args: CreateDatabaseParameters
    ): Promise<CreateDatabaseResponse> => {
      return this.notionClient.databases.create(args)
    },

    update: (
      args: UpdateDatabaseParameters
    ): Promise<UpdateDatabaseResponse> => {
      return this.notionClient.databases.update(args)
    },
  }

  public readonly pages = {
    create: (args: CreatePageParameters): Promise<CreatePageResponse> => {
      return this.notionClient.pages.create(args)
    },

    /**
     * Retrieve page
     */
    retrieve: (
      args: GetPageParameters,
      level: number = 0
    ): Promise<GetPageResponse> => {
      this.logClientMessage({
        resource_type: CacheType.PAGE,
        source: "CLIENT",
        operation: "RETRIEVE",
        id: args.page_id,
        level: level,
      })
      // Check if we have it in cache
      const pageFromCache = this.cache.getPage(args.page_id, level + 1)
      if (pageFromCache) {
        return Promise.resolve(pageFromCache)
      }

      return executeWithRateLimitAndRetries(
        `pages.retrieve(${args.page_id})`,
        () => {
          this.logClientMessage({
            resource_type: CacheType.PAGE,
            source: "NOTION",
            operation: "RETRIEVE",
            id: args.page_id,
            level: level + 1,
          })
          return this.notionClient.pages.retrieve(args)
        }
      ).then((response) => {
        // Saving to cache here
        if (!isFullPage(response)) {
          throw Error(`Non full page: ${JSON.stringify(response)}`)
        }
        this.cache.setPage(response, level + 1)
        return response
      })
    },
    update: (args: UpdatePageParameters): Promise<UpdatePageResponse> => {
      return this.notionClient.pages.update(args)
    },

    properties: {
      retrieve: (
        args: GetPagePropertyParameters
      ): Promise<GetPagePropertyResponse> => {
        return this.notionClient.pages.properties.retrieve(args)
      },
    },
  }

  private logClientMessage({
    resource_type,
    operation,
    source,
    id,
    level,
  }: {
    id: string
    source: "CLIENT" | "NOTION"
    operation: "RETRIEVE" | "CREATE" | "UPDATE"
    resource_type: CacheType
    level: number
  }) {
    logOperation({
      level,
      source: source,
      operation,
      resource_type,
      id,
    })
  }
}

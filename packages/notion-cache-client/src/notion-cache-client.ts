import { info } from "console"
import {
  Client,
  collectPaginatedAPI,
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
  PartialBlockObjectResponse,
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
  _stats: {
    calls: Record<CacheType, number>
  }

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
    this._stats = {
      calls: {
        database: 0,
        block: 0,
        page: 0,
        database_children: 0,
        blocks_children: 0,
      },
    }
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

        // TODO: Fix, when getting multiple pages, the new page replaces the old one because of args

        // Check if we have it in cache
        const childrenFromCache = this.cache.getBlockChildren(
          args.block_id,
          level + 1
        )
        if (childrenFromCache) {
          return Promise.resolve(childrenFromCache)
        }

        return collectPaginatedAPI(
          (args: ListBlockChildrenParameters) =>
            executeWithRateLimitAndRetries(
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
            ),
          { block_id: args.block_id }
        ).then((blocksChildrenResults) => {
          const fullBlocksChildrenResults = blocksChildrenResults.filter(
            (block) => isFullBlock(block)
          ) as BlockObjectResponse[]
          if (
            fullBlocksChildrenResults.length !== blocksChildrenResults.length
          ) {
            throw new Error(
              `Non full blocks in children: ${JSON.stringify(
                blocksChildrenResults
              )}`
            )
          }

          const fullBlocksChildrenResponse = this._toBlockChildrenResponse(
            fullBlocksChildrenResults
          )
          this.cache.setBlockChildren(
            args.block_id,
            fullBlocksChildrenResponse,
            level + 1
          )
          return fullBlocksChildrenResponse
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

      return collectPaginatedAPI(
        (args: QueryDatabaseParameters) =>
          executeWithRateLimitAndRetries(
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
          ),
        { database_id: args.database_id }
      ).then((databaseChildrenResults) => {
        const fullDatabaseChildrenResults = databaseChildrenResults.filter(
          (database) => isFullPageOrDatabase(database)
        ) as (PageObjectResponse | DatabaseObjectResponse)[]
        if (
          fullDatabaseChildrenResults.length !== databaseChildrenResults.length
        ) {
          throw new Error(
            `Non full page or database children: ${JSON.stringify(
              databaseChildrenResults
            )}`
          )
        }
        const databaseChildrenResponse = this._toDatabaseChildrenResponse(
          fullDatabaseChildrenResults
        )
        this.cache.setDatabaseChildren(
          args.database_id,
          databaseChildrenResponse,
          level + 1
        )
        return databaseChildrenResponse
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

  private _toBlockChildrenResponse(
    blocksChildrenResults: BlockObjectResponse[]
  ): ListBlockChildrenResponse & {
    results: BlockObjectResponse[]
  } {
    return {
      type: "block",
      block: {},
      object: "list",
      next_cursor: null,
      has_more: false,
      results: blocksChildrenResults,
    }
  }

  private _toDatabaseChildrenResponse(
    databaseChildrenResults: (DatabaseObjectResponse | PageObjectResponse)[]
  ): QueryDatabaseResponse & {
    results: (DatabaseObjectResponse | PageObjectResponse)[]
  } {
    return {
      type: "page_or_database",
      page_or_database: {},
      object: "list",
      next_cursor: null,
      has_more: false,
      results: databaseChildrenResults,
    }
  }

  public get stats() {
    return this._stats
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
    if (source === "NOTION") {
      // TODO: Debug stats, too many calls!!
      this.stats.calls[resource_type]++
    }
    logOperation({
      level,
      source: source,
      operation,
      resource_type,
      id,
    })
  }
}

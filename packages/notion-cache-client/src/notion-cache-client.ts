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
import fs from "fs-extra"

import { executeWithRateLimitAndRetries } from "./executeWithRateLimitAndRetries"
import {
  BlocksChildrenCache,
  DatabaseChildrenCache,
  NotionBlockObjectsCache,
  NotionDatabaseObjectsCache,
  NotionPageObjectsCache,
} from "./notion-structures-types"
import { saveDataToJson } from "./utils"

export class NotionCacheClient extends Client {
  databaseChildrenCache: DatabaseChildrenCache
  blocksChildrenCache: BlocksChildrenCache
  pageObjectsCache: NotionPageObjectsCache
  databaseObjectsCache: NotionDatabaseObjectsCache
  blockObjectsCache: NotionBlockObjectsCache
  notionClient: Client
  cacheDirectory: string

  // TODO: Implement better logging (like turbo repo)

  private readonly blockChildrenCacheFilename = "block_children_cache.json"

  private readonly databaseChildrenCacheFilename =
    "database_children_cache.json"

  private readonly pageObjectsCacheFilename = "page_objects_cache.json"

  private readonly databaseObjectsCacheFilename = "database_objects_cache.json"

  private readonly blocksObjectsCacheFilename = "block_objects_cache.json"

  constructor({
    auth,
    pageObjectsCache,
    databaseObjectsCache,
    blockObjectsCache,
    databaseChildrenCache,
    blocksChildrenCache,
    cacheDirectory,
  }: {
    auth: string
    pageObjectsCache?: NotionPageObjectsCache
    databaseObjectsCache?: NotionDatabaseObjectsCache
    blockObjectsCache?: NotionBlockObjectsCache
    databaseChildrenCache?: DatabaseChildrenCache
    blocksChildrenCache?: BlocksChildrenCache
    cacheDirectory?: string
  }) {
    super({
      auth: auth,
    })
    this.notionClient = new Client({ auth })
    this.databaseChildrenCache = databaseChildrenCache || {}
    this.blocksChildrenCache = blocksChildrenCache || {}
    this.pageObjectsCache = pageObjectsCache || {}
    this.databaseObjectsCache = databaseObjectsCache || {}
    this.blockObjectsCache = blockObjectsCache || {}
    this.cacheDirectory = cacheDirectory
      ? cacheDirectory?.replace(/\/+$/, "") + "/"
      : "./.cache/"
  }

  // TODO: fix type annotations by only making get methods available or wrap the rest of the methods
  public readonly blocks = {
    /**
     * Retrieve block
     */
    retrieve: (args: GetBlockParameters): Promise<GetBlockResponse> => {
      // Check if we have it in cache
      if (this.blockObjectsCache[args.block_id]) {
        this.logCacheMessage({
          operation: "HIT",
          cache_type: "block",
          id: args.block_id,
        })
        return Promise.resolve(this.blockObjectsCache[args.block_id])
      }

      this.logCacheMessage({
        operation: "MISS",
        cache_type: "block",
        id: args.block_id,
      })
      return executeWithRateLimitAndRetries(
        `blocks.retrieve(${args.block_id})`,
        () => {
          return this.notionClient.blocks.retrieve(args)
        }
      ).then((response) => {
        // Saving to cache here
        this.logCacheMessage({
          operation: "SAVE",
          cache_type: "block",
          id: args.block_id,
        })
        if (!isFullBlock(response)) {
          throw Error(`Non full page: ${JSON.stringify(response)}`)
        }
        this.blockObjectsCache[args.block_id] = response
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
        args: ListBlockChildrenParameters
      ): Promise<ListBlockChildrenResponse> => {
        // Check if we have it in cache
        if (this.blocksChildrenCache[args.block_id]) {
          // We have it in cache
          this.logCacheMessage({
            operation: "HIT",
            cache_type: "block_children",
            id: args.block_id,
          })
          const childrenIds = this.blocksChildrenCache[args.block_id].children
          const results = childrenIds
            .map((id) => this.blockObjectsCache[id])
            .filter(Boolean) as BlockObjectResponse[]
          if (results.length !== childrenIds.length) {
            console.log(`LocalNotionClient: Block children not HIT in cache.`)
            throw Error("Inconsistent state: Block children not HIT in cache.")
          }

          const response: ListBlockChildrenResponse = {
            type: "block",
            block: {},
            object: "list",
            next_cursor: null,
            has_more: false,
            results: results,
          }

          return Promise.resolve(response)
        }
        // Fallback to calling API
        this.logCacheMessage({
          operation: "MISS",
          cache_type: "block_children",
          id: args.block_id,
        })
        // TODO: Query on a while loop until no more pages available

        // TODO: Handle case in which options are used
        return executeWithRateLimitAndRetries(
          `blocks.children.list(${args.block_id})`,
          () => {
            return this.notionClient.blocks.children.list(args)
          }
        ).then((response) => {
          // Saving to cache here
          this.logCacheMessage({
            operation: "SAVE",
            cache_type: "block_children",
            id: args.block_id,
          })
          this.blocksChildrenCache[args.block_id] = {
            children: response.results.map((child) => child.id),
          }
          response.results.forEach((child) => {
            if (!isFullBlock(child)) {
              throw Error(`Non full block: ${JSON.stringify(response)}`)
            }
            this.blockObjectsCache[child.id] = child
          })
          return response
        })
      },
    },
  }

  // TODO: fix type annotations by only making get methods available or wrap the rest of the methods
  public readonly databases = {
    list: (args: ListDatabasesParameters): Promise<ListDatabasesResponse> => {
      return this.notionClient.databases.list(args)
    },

    /**
     * Retrieve database
     */
    retrieve: (args: GetDatabaseParameters): Promise<GetDatabaseResponse> => {
      // Check if we have it in cache
      if (this.pageObjectsCache[args.database_id]) {
        this.logCacheMessage({
          operation: "HIT",
          cache_type: "database",
          id: args.database_id,
        })
        return Promise.resolve(this.databaseObjectsCache[args.database_id])
      }
      this.logCacheMessage({
        operation: "MISS",
        cache_type: "database",
        id: args.database_id,
      })
      return executeWithRateLimitAndRetries(
        `databases.retrieve(${args.database_id})`,
        () => {
          return this.notionClient.databases.retrieve(args)
        }
      ).then((response) => {
        // Saving to cache here
        this.logCacheMessage({
          operation: "SAVE",
          cache_type: "database",
          id: args.database_id,
        })
        if (!isFullDatabase(response)) {
          throw Error(`Non full database: ${JSON.stringify(response)}`)
        }
        this.databaseObjectsCache[args.database_id] = response
        return response
      })
    },

    query: (args: QueryDatabaseParameters): Promise<QueryDatabaseResponse> => {
      // Check if we have it in cache
      if (this.databaseChildrenCache[args.database_id]) {
        // We have it in cache
        this.logCacheMessage({
          operation: "HIT",
          cache_type: "database_children",
          id: args.database_id,
        })
        const childrenIds =
          this.databaseChildrenCache[args.database_id].children
        const results = childrenIds
          .map(
            (id) => this.pageObjectsCache[id] || this.databaseObjectsCache[id]
          )
          .filter(Boolean) as PageObjectResponse[] | DatabaseObjectResponse[]
        if (results.length !== childrenIds.length) {
          console.log(`LocalNotionClient: Database children not HIT in cache.`)
          throw Error("Inconsistent state: Database children not HIT in cache.")
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
      this.logCacheMessage({
        operation: "MISS",
        cache_type: "database_children",
        id: args.database_id,
      })

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
          if (isFullPage(child)) {
            this.logCacheMessage({
              operation: "SAVE",
              cache_type: "page",
              id: child.id,
            })
            this.pageObjectsCache[child.id] = child
          } else {
            this.logCacheMessage({
              operation: "SAVE",
              cache_type: "database",
              id: child.id,
            })
            this.databaseObjectsCache[child.id] = child
          }
        })
        this.logCacheMessage({
          operation: "SAVE",
          cache_type: "database_children",
          id: args.database_id,
        })
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

  // TODO: fix type annotations by only making get methods available or wrap the rest of the methods
  public readonly pages = {
    create: (args: CreatePageParameters): Promise<CreatePageResponse> => {
      return this.notionClient.pages.create(args)
    },

    /**
     * Retrieve page
     */
    retrieve: (args: GetPageParameters): Promise<GetPageResponse> => {
      // Check if we have it in cache
      if (this.pageObjectsCache[args.page_id]) {
        this.logCacheMessage({
          operation: "HIT",
          cache_type: "page",
          id: args.page_id,
        })
        return Promise.resolve(this.pageObjectsCache[args.page_id])
      }
      this.logCacheMessage({
        operation: "MISS",
        cache_type: "page",
        id: args.page_id,
      })
      return executeWithRateLimitAndRetries(
        `pages.retrieve(${args.page_id})`,
        () => {
          return this.notionClient.pages.retrieve(args)
        }
      ).then((response) => {
        // Saving to cache here
        this.logCacheMessage({
          operation: "SAVE",
          cache_type: "page",
          id: args.page_id,
        })
        if (!isFullPage(response)) {
          throw Error(`Non full page: ${JSON.stringify(response)}`)
        }
        this.pageObjectsCache[args.page_id] = response
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

  private loadDataFromJson = (filePath: string) => {
    if (fs.existsSync(filePath)) {
      const jsonData = fs.readFileSync(filePath, "utf8")
      return JSON.parse(jsonData)
    }
    return undefined
  }

  loadCache = async () => {
    const cacheDir = this.cacheDirectory
    if (await fs.pathExists(cacheDir + this.blockChildrenCacheFilename)) {
      this.blocksChildrenCache =
        this.loadDataFromJson(cacheDir + this.blockChildrenCacheFilename) || {}
    }
    if (await fs.pathExists(cacheDir + this.databaseChildrenCacheFilename)) {
      this.databaseChildrenCache =
        this.loadDataFromJson(cacheDir + this.databaseChildrenCacheFilename) ||
        {}
    }
    if (await fs.pathExists(cacheDir + this.pageObjectsCacheFilename)) {
      this.pageObjectsCache =
        this.loadDataFromJson(cacheDir + this.pageObjectsCacheFilename) || {}
    }
    if (await fs.pathExists(cacheDir + this.databaseObjectsCacheFilename)) {
      this.databaseObjectsCache =
        this.loadDataFromJson(cacheDir + this.databaseObjectsCacheFilename) ||
        {}
    }
    if (await fs.pathExists(cacheDir + this.blocksObjectsCacheFilename)) {
      this.blockObjectsCache =
        this.loadDataFromJson(cacheDir + this.blocksObjectsCacheFilename) || {}
    }
  }

  saveCache = () => {
    const cacheDir = this.cacheDirectory
    if (!fs.existsSync(cacheDir)) {
      // Make dir recursively
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    const promises = []
    promises.push(
      saveDataToJson(
        this.blocksChildrenCache,
        cacheDir + this.blockChildrenCacheFilename
      )
    )

    promises.push(
      saveDataToJson(
        this.databaseChildrenCache,
        cacheDir + this.databaseChildrenCacheFilename
      )
    )

    promises.push(
      saveDataToJson(
        this.pageObjectsCache,
        cacheDir + this.pageObjectsCacheFilename
      )
    )

    promises.push(
      saveDataToJson(
        this.databaseObjectsCache,
        cacheDir + this.databaseObjectsCacheFilename
      )
    )

    promises.push(
      saveDataToJson(
        this.blockObjectsCache,
        cacheDir + this.blocksObjectsCacheFilename
      )
    )
    return Promise.all(promises)
  }

  private logCacheMessage({
    cache_type,
    operation,
    id,
  }: {
    id: string
    operation: "HIT" | "SAVE" | "MISS"
    cache_type:
      | "block"
      | "database"
      | "page"
      | "block_children"
      | "database_children"
  }) {
    info(`CACHE: (${operation}) (${cache_type}) : ${id}`)
  }
}

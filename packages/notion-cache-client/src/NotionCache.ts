import { isFullBlock, isFullPage, isFullPageOrDatabase } from "@notionhq/client"
import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints"
import fs from "fs-extra"

import { info } from "./log"
import {
  BlocksChildrenCache,
  CacheInfo,
  DatabaseChildrenCache,
  NotionBlockObjectsCache,
  NotionDatabaseObjectsCache,
  NotionPageObjectsCache,
} from "./notion-structures-types"
import { saveDataToJson } from "./utils"

export type NotionCacheOptions = {
  pageObjectsCache?: NotionPageObjectsCache
  databaseObjectsCache?: NotionDatabaseObjectsCache
  blockObjectsCache?: NotionBlockObjectsCache
  databaseChildrenCache?: DatabaseChildrenCache
  blocksChildrenCache?: BlocksChildrenCache
  cacheDirectory?: string
}

export class NotionCache {
  databaseChildrenCache: DatabaseChildrenCache
  blocksChildrenCache: BlocksChildrenCache
  pageObjectsCache: NotionPageObjectsCache
  databaseObjectsCache: NotionDatabaseObjectsCache
  blockObjectsCache: NotionBlockObjectsCache
  cacheDirectory: string

  private readonly blockChildrenCacheFilename = "block_children_cache.json"

  private readonly databaseChildrenCacheFilename =
    "database_children_cache.json"

  private readonly pageObjectsCacheFilename = "page_objects_cache.json"

  private readonly databaseObjectsCacheFilename = "database_objects_cache.json"

  private readonly blocksObjectsCacheFilename = "block_objects_cache.json"

  constructor({
    pageObjectsCache,
    databaseObjectsCache,
    blockObjectsCache,
    databaseChildrenCache,
    blocksChildrenCache,
    cacheDirectory,
  }: NotionCacheOptions) {
    this.databaseChildrenCache = databaseChildrenCache || {}
    this.blocksChildrenCache = blocksChildrenCache || {}
    this.pageObjectsCache = pageObjectsCache || {}
    this.databaseObjectsCache = databaseObjectsCache || {}
    this.blockObjectsCache = blockObjectsCache || {}
    this.cacheDirectory = cacheDirectory
      ? cacheDirectory?.replace(/\/+$/, "") + "/"
      : "./.cache/"
  }

  getBlock(id: string) {
    if (
      this.blockObjectsCache[id] &&
      !this.blockObjectsCache[id].__needs_refresh
    ) {
      this.logCacheMessage({
        operation: "HIT",
        cache_type: "block",
        id: id,
      })
      return this.blockObjectsCache[id].data
    }

    this.logCacheMessage({
      operation: this.getNonHitOperation(this.blockObjectsCache[id]),
      cache_type: "block",
      id: id,
    })
    return undefined
  }

  setBlock(response: BlockObjectResponse) {
    this.blockObjectsCache[response.id] = {
      data: response,
      __needs_refresh: false,
    }
    this.logCacheMessage({
      operation: "SAVE",
      cache_type: "block",
      id: response.id,
    })
  }

  getBlockChildren(id: string) {
    if (
      this.blocksChildrenCache[id] &&
      !this.blocksChildrenCache[id].__needs_refresh
    ) {
      this.logCacheMessage({
        operation: "HIT",
        cache_type: "block_children",
        id: id,
      })
      const childrenIds = this.blocksChildrenCache[id].data.children
      const results = childrenIds
        .filter((childId) => !this.blockObjectsCache[childId].__needs_refresh)
        .map((childId) => this.blockObjectsCache[childId].data)

      if (results.length !== childrenIds.length) {
        console.log(`NotionCacheClient: Block children not HIT in cache.`)
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
      return response
    }

    this.logCacheMessage({
      operation: this.getNonHitOperation(this.blocksChildrenCache[id]),
      cache_type: "block_children",
      id: id,
    })
    return undefined
  }

  setBlockChildren(response: ListBlockChildrenResponse) {
    this.blocksChildrenCache[response.block.id] = {
      data: {
        children: response.results.map((child) => child.id),
      },
      __needs_refresh: false,
    }
    response.results.forEach((child) => {
      if (!isFullBlock(child)) {
        throw Error(`Non full block: ${JSON.stringify(response)}`)
      }
      this.blockObjectsCache[child.id] = {
        data: child,
        __needs_refresh: false,
      }
    })
    this.logCacheMessage({
      operation: "SAVE",
      cache_type: "block_children",
      id: response.block.id,
    })
  }

  getDatabase(id: string) {
    if (
      this.databaseObjectsCache[id] &&
      !this.databaseObjectsCache[id].__needs_refresh
    ) {
      this.logCacheMessage({
        operation: "HIT",
        cache_type: "database",
        id: id,
      })
      return this.databaseObjectsCache[id].data
    }

    this.logCacheMessage({
      operation: this.getNonHitOperation(this.databaseObjectsCache[id]),
      cache_type: "database",
      id: id,
    })
    return undefined
  }

  setDatabase(response: DatabaseObjectResponse) {
    this.databaseObjectsCache[response.id] = {
      data: response,
      __needs_refresh: false,
    }
    this.logCacheMessage({
      operation: "SAVE",
      cache_type: "database",
      id: response.id,
    })
  }

  getDatabaseChildren(id: string) {
    if (
      this.databaseChildrenCache[id] &&
      !this.databaseChildrenCache[id].__needs_refresh
    ) {
      this.logCacheMessage({
        operation: "HIT",
        cache_type: "database_children",
        id: id,
      })
      const childrenIds = this.databaseChildrenCache[id].data.children
      const cacheItems = childrenIds.map(
        (id) => this.pageObjectsCache[id] || this.databaseObjectsCache[id]
      )
      const isAnyStale = cacheItems.some((item) => item?.__needs_refresh)
      const results = cacheItems.map((item) => item?.data)

      if (results.length !== childrenIds.length || isAnyStale) {
        console.log(`NotionCacheClient: Database children not HIT in cache.`)
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
      return response
    }
    this.logCacheMessage({
      operation: this.getNonHitOperation(this.databaseChildrenCache[id]),
      cache_type: "database_children",
      id: id,
    })
    return undefined
  }

  setDatabaseChildren(response: QueryDatabaseResponse) {
    this.databaseChildrenCache[response.page_or_database.id] = {
      data: {
        children: response.results.map((child) => child.id),
      },
      __needs_refresh: false,
    }
    this.logCacheMessage({
      operation: "SAVE",
      cache_type: "database_children",
      id: response.page_or_database.id,
    })
    response.results.forEach((child) => {
      if (!isFullPageOrDatabase(child)) {
        throw new Error(`Non full page or database: ${JSON.stringify(child)}`)
      }
      if (isFullPage(child)) {
        this.logCacheMessage({
          operation: "SAVE",
          cache_type: "page",
          id: child.id,
        })
        this.pageObjectsCache[child.id] = {
          data: child,
          __needs_refresh: false,
        }
      } else {
        this.logCacheMessage({
          operation: "SAVE",
          cache_type: "database",
          id: child.id,
        })
        this.databaseObjectsCache[child.id] = {
          data: child,
          __needs_refresh: false,
        }
      }
    })
  }

  getPage(id: string) {
    if (
      this.pageObjectsCache[id] &&
      !this.pageObjectsCache[id].__needs_refresh
    ) {
      this.logCacheMessage({
        operation: "HIT",
        cache_type: "page",
        id: id,
      })
      return this.pageObjectsCache[id].data
    }

    this.logCacheMessage({
      operation: this.getNonHitOperation(this.pageObjectsCache[id]),
      cache_type: "page",
      id: id,
    })
    return undefined
  }

  setPage(response: PageObjectResponse) {
    this.pageObjectsCache[response.id] = {
      data: response,
      __needs_refresh: false,
    }
    this.logCacheMessage({
      operation: "SAVE",
      cache_type: "page",
      id: response.id,
    })
  }

  private getNonHitOperation(cacheItem: CacheInfo | undefined) {
    if (cacheItem && cacheItem.__needs_refresh) {
      return "REFRESH"
    }
    return "MISS"
  }

  private logCacheMessage({
    cache_type,
    operation,
    id,
  }: {
    id: string
    operation: "HIT" | "SAVE" | "MISS" | "REFRESH"
    cache_type:
      | "block"
      | "database"
      | "page"
      | "block_children"
      | "database_children"
  }) {
    info(`CACHE: (${operation}) (${cache_type}) : ${id}`)
  }

  clearCache = () => {
    this.blocksChildrenCache = {}
    this.databaseChildrenCache = {}
    this.pageObjectsCache = {}
    this.databaseObjectsCache = {}
    this.blockObjectsCache = {}

    this.saveCache()
  }

  setNeedsRefresh = () => {
    Object.values(this.pageObjectsCache).forEach((page) => {
      page.__needs_refresh = true
    })
    Object.values(this.databaseObjectsCache).forEach((database) => {
      database.__needs_refresh = true
    })
    Object.values(this.blockObjectsCache).forEach((block) => {
      block.__needs_refresh = true
    })
    Object.values(this.blocksChildrenCache).forEach((children) => {
      children.__needs_refresh = true
    })
    Object.values(this.databaseChildrenCache).forEach((children) => {
      children.__needs_refresh = true
    })
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

  private loadDataFromJson = (filePath: string) => {
    if (fs.existsSync(filePath)) {
      const jsonData = fs.readFileSync(filePath, "utf8")
      return JSON.parse(jsonData)
    }
    return undefined
  }
}

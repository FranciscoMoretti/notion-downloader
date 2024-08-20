import { isFullBlock, isFullPage, isFullPageOrDatabase } from "@notionhq/client"
import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints"

import { NotionCacheFiles } from "./NotionCacheFiles"
import { info } from "./log"
import {
  BlocksChildrenCache,
  CacheInfo,
  DatabaseChildrenCache,
  NotionBlockObjectsCache,
  NotionDatabaseObjectsCache,
  NotionPageObjectsCache,
} from "./notion-structures-types"

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
  cacheFiles: NotionCacheFiles

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

    this.cacheFiles = new NotionCacheFiles(cacheDirectory)
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

  setBlock(response: BlockObjectResponse, level: number = 0) {
    if (
      this.blockObjectsCache[response.id]?.data.last_edited_time ===
      response.last_edited_time
    ) {
      this.blockObjectsCache[response.id].__needs_refresh = false
      this.logCacheMessage({
        operation: "SET_NO_CHANGE",
        cache_type: "block",
        id: response.id,
        level: level,
      })
      // Update block children if it has any
      if (this.blocksChildrenCache[response.id]) {
        this.setBlockChildren(
          response.id,
          this._buildListBlockChildrenResponseFromCache(response.id),
          level + 1
        )
      }
      return
    }

    this.blockObjectsCache[response.id] = {
      data: response,
      __needs_refresh: false,
    }
    this.logCacheMessage({
      operation: "SET_NEW",
      cache_type: "block",
      id: response.id,
      level: level,
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
      const response: ListBlockChildrenResponse =
        this._buildListBlockChildrenResponseFromCache(id)
      response.results.forEach((child) => {
        if (this.blockObjectsCache[child.id].__needs_refresh) {
          const errorMessage =
            "Inconsistent state: Block children not HIT in cache." + child.id
          console.log(errorMessage)
          throw Error(errorMessage)
        }
      })

      return response
    }

    this.logCacheMessage({
      operation: this.getNonHitOperation(this.blocksChildrenCache[id]),
      cache_type: "block_children",
      id: id,
    })
    return undefined
  }

  private _buildListBlockChildrenResponseFromCache(id: string) {
    const childrenIds = this.blocksChildrenCache[id].data.children
    const results = childrenIds.map(
      (childId) => this.blockObjectsCache[childId].data
    )

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

  setBlockChildren(
    id: string,
    response: ListBlockChildrenResponse,
    level: number = 0
  ) {
    const newChildren = response.results.map((child) => child.id)
    if (
      this.blocksChildrenCache[id]?.data.children.join(",") ===
      newChildren.join(",")
    ) {
      this.blocksChildrenCache[id].__needs_refresh = false
      this.logCacheMessage({
        operation: "SET_NO_CHANGE",
        cache_type: "block_children",
        id: id,
        level: level,
      })

      this.blocksChildrenCache[id].data.children.forEach((child) => {
        this.setBlock(this.blockObjectsCache[child].data, level + 1)
      })
      return
    }

    this.blocksChildrenCache[id] = {
      data: {
        children: response.results.map((child) => child.id),
      },
      __needs_refresh: false,
    }
    this.logCacheMessage({
      operation: "SET_NEW",
      cache_type: "block_children",
      id: id,
      level: level,
    })
    response.results.forEach((child) => {
      if (!isFullBlock(child)) {
        throw Error(`Non full block: ${JSON.stringify(response)}`)
      }
      this.setBlock(child, level + 1)
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

  setDatabase(response: DatabaseObjectResponse, level: number = 0) {
    // Read last record
    // TODO: This operation doesn't add much value at the moment
    if (
      this.databaseObjectsCache[response.id]?.data.last_edited_time ===
      response.last_edited_time
    ) {
      // Mark as up-to-date
      this.databaseObjectsCache[response.id].__needs_refresh = false
      this.logCacheMessage({
        operation: "SET_NO_CHANGE",
        cache_type: "database",
        id: response.id,
        level: level,
      })
      // add/remove children or database properties change the edit time. But changes in the children pages don't
      // TODO: Mark children as up-to-date if exist? This would cause a problem when trying to get children pages
      // if (this.databaseChildrenCache[response.id]) {
      //   this.databaseChildrenCache[response.id].__needs_refresh = false
      // }
      return
    }

    this.databaseObjectsCache[response.id] = {
      data: response,
      __needs_refresh: false,
    }
    this.logCacheMessage({
      operation: "SET_NEW",
      cache_type: "database",
      id: response.id,
      level: level,
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

  // TODO: This is setting as no-change pages that have blocks that have been modified!!!!
  setDatabaseChildren(
    id: string,
    response: QueryDatabaseResponse,
    level: number = 0
  ) {
    const newChildren = response.results.map((child) => child.id)
    const operation =
      this.databaseChildrenCache[id]?.data.children.join(",") ===
      newChildren.join(",")
        ? "SET_NO_CHANGE"
        : "SET_NEW"
    this.databaseChildrenCache[id] = {
      data: {
        children: newChildren,
      },
      __needs_refresh: false,
    }
    this.logCacheMessage({
      operation: operation,
      cache_type: "database_children",
      id: id,
      level: level,
    })
    response.results.forEach((child) => {
      if (!isFullPageOrDatabase(child)) {
        throw new Error(`Non full page or database: ${JSON.stringify(child)}`)
      }
      if (isFullPage(child)) {
        this.setPage(child, level + 1)
      } else {
        this.setDatabase(child, level + 1)
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

  setPage(response: PageObjectResponse, level: number = 0) {
    if (
      this.pageObjectsCache[response.id]?.data.last_edited_time ===
      response.last_edited_time
    ) {
      // Mark as up-to-date
      this.pageObjectsCache[response.id].__needs_refresh = false
      this.logCacheMessage({
        operation: "SET_NO_CHANGE",
        cache_type: "page",
        id: response.id,
        level: level,
      })
      // Mark block children as updated
      this.setBlockChildren(
        response.id,
        this._buildListBlockChildrenResponseFromCache(response.id),
        level + 1
      )
      return
    }

    this.pageObjectsCache[response.id] = {
      data: response,
      __needs_refresh: false,
    }
    this.logCacheMessage({
      operation: "SET_NEW",
      cache_type: "page",
      id: response.id,
    })
    // Invalidate dependants
    // TODO: Operations are the most atomic entity. They remove all descendants together. Can it be more selective?
    this._deleteBlockChildren(response.id)
  }

  private _deleteBlockChildren(id: string) {
    const childBlocks = this.blocksChildrenCache[id]
    childBlocks?.data.children.forEach((childId) => {
      delete this.blockObjectsCache[childId]
    })
    delete this.blocksChildrenCache[id]
  }

  private getNonHitOperation(cacheItem: CacheInfo | undefined) {
    if (cacheItem?.__needs_refresh) {
      return "MISS_NEEDS_UPDATE"
    }
    return "MISS_NO_EXISTS"
  }

  private logCacheMessage({
    cache_type,
    operation,
    id,
    level = 0,
  }: {
    id: string
    operation:
      | "HIT"
      | "SET_NEW"
      | "SET_CHANGE"
      | "SET_NO_CHANGE"
      | "MISS_NO_EXISTS"
      | "MISS_NEEDS_UPDATE"
    cache_type:
      | "block"
      | "database"
      | "page"
      | "block_children"
      | "database_children"
    level?: number
  }) {
    const levelPadding =
      "  ".repeat(Math.max(level - 1, 0)) + (level ? "└─" : "")
    info(`${levelPadding}[CACHE]: (${operation}) (${cache_type}) : ${id}`)
  }

  clearCache = async () => {
    this.blocksChildrenCache = {}
    this.databaseChildrenCache = {}
    this.pageObjectsCache = {}
    this.databaseObjectsCache = {}
    this.blockObjectsCache = {}

    await this.saveCache()
  }

  saveCache = async () => {
    await this.cacheFiles.saveCache({
      blocksChildrenCache: this.blocksChildrenCache,
      databaseChildrenCache: this.databaseChildrenCache,
      pageObjectsCache: this.pageObjectsCache,
      databaseObjectsCache: this.databaseObjectsCache,
      blockObjectsCache: this.blockObjectsCache,
    })
  }
  loadCache = async () => {
    const {
      blocksChildrenCache,
      databaseChildrenCache,
      pageObjectsCache,
      databaseObjectsCache,
      blockObjectsCache,
    } = await this.cacheFiles.loadCache()
    this.blocksChildrenCache = blocksChildrenCache
    this.databaseChildrenCache = databaseChildrenCache
    this.pageObjectsCache = pageObjectsCache
    this.databaseObjectsCache = databaseObjectsCache
    this.blockObjectsCache = blockObjectsCache
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
}

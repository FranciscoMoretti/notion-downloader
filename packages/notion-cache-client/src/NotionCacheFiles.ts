import fs from "fs-extra"

import {
  BlocksChildrenCache,
  DatabaseChildrenCache,
  NotionBlockObjectsCache,
  NotionDatabaseObjectsCache,
  NotionPageObjectsCache,
} from "./notion-structures-types"
import { loadDataFromJson, saveObjectToJson } from "./utils"

export class NotionCacheFiles {
  cacheDirectory: string

  constructor(cacheDirectory: string | undefined) {
    this.cacheDirectory = cacheDirectory
      ? cacheDirectory?.replace(/\/+$/, "") + "/"
      : "./.cache/"
  }

  private readonly blockChildrenCacheFilename = "block_children_cache.json"

  private readonly databaseChildrenCacheFilename =
    "database_children_cache.json"

  private readonly pageObjectsCacheFilename = "page_objects_cache.json"

  private readonly databaseObjectsCacheFilename = "database_objects_cache.json"

  private readonly blocksObjectsCacheFilename = "block_objects_cache.json"
  saveCache = ({
    blocksChildrenCache,
    databaseChildrenCache,
    pageObjectsCache,
    databaseObjectsCache,
    blockObjectsCache,
  }: {
    blocksChildrenCache: BlocksChildrenCache
    databaseChildrenCache: DatabaseChildrenCache
    pageObjectsCache: NotionPageObjectsCache
    databaseObjectsCache: NotionDatabaseObjectsCache
    blockObjectsCache: NotionBlockObjectsCache
  }) => {
    const cacheDir = this.cacheDirectory
    if (!fs.existsSync(cacheDir)) {
      // Make dir recursively
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    const promises = []
    promises.push(
      saveObjectToJson(
        blocksChildrenCache,
        cacheDir + this.blockChildrenCacheFilename
      )
    )

    promises.push(
      saveObjectToJson(
        databaseChildrenCache,
        cacheDir + this.databaseChildrenCacheFilename
      )
    )

    promises.push(
      saveObjectToJson(
        pageObjectsCache,
        cacheDir + this.pageObjectsCacheFilename
      )
    )

    promises.push(
      saveObjectToJson(
        databaseObjectsCache,
        cacheDir + this.databaseObjectsCacheFilename
      )
    )

    promises.push(
      saveObjectToJson(
        blockObjectsCache,
        cacheDir + this.blocksObjectsCacheFilename
      )
    )
    return Promise.all(promises)
  }

  loadCache = async () => {
    const cacheDir = this.cacheDirectory
    const blocksChildrenCache =
      (await loadDataFromJson(cacheDir + this.blockChildrenCacheFilename)) || {}
    const databaseChildrenCache =
      (await loadDataFromJson(cacheDir + this.databaseChildrenCacheFilename)) ||
      {}
    const pageObjectsCache =
      (await loadDataFromJson(cacheDir + this.pageObjectsCacheFilename)) || {}
    const databaseObjectsCache =
      (await loadDataFromJson(cacheDir + this.databaseObjectsCacheFilename)) ||
      {}
    const blockObjectsCache =
      (await loadDataFromJson(cacheDir + this.blocksObjectsCacheFilename)) || {}
    return Promise.resolve({
      blocksChildrenCache,
      databaseChildrenCache,
      pageObjectsCache,
      databaseObjectsCache,
      blockObjectsCache,
    })
  }
}

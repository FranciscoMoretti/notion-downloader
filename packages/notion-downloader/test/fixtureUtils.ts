import path from "node:path"
import { NotionCache, NotionCacheClient } from "notion-cache-client"

export function getFixture(name: "sample-site") {
  return path.resolve(__dirname, `fixtures/${name}/.downloader`)
}
// TODO: Fixtures should be moved to its own package

export async function buildNotionCacheWithFixture(name: "sample-site") {
  const cacheDirectory = getFixture(name)
  const notionCache = new NotionCache({
    cacheDirectory,
  })
  await notionCache.loadCache()
  return Promise.resolve(notionCache)
}

export async function buildNotionCacheClientWithFixture(name: "sample-site") {
  const cacheDirectory = getFixture(name)
  const notionCache = new NotionCache({
    cacheDirectory,
  })
  await notionCache.loadCache()
  const notionCacheClient = new NotionCacheClient({
    auth: "dummy",
    cacheOptions: {
      cacheDirectory,
      blocksChildrenCache: notionCache.blocksChildrenCache,
      databaseChildrenCache: notionCache.databaseChildrenCache,
      pageObjectsCache: notionCache.pageObjectsCache,
      databaseObjectsCache: notionCache.databaseObjectsCache,
      blockObjectsCache: notionCache.blockObjectsCache,
    },
  })
  return Promise.resolve(notionCacheClient)
}

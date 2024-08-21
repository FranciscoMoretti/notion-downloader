import path from "node:path"
import { NotionCache } from "../src/NotionCache"

export function getFixture(name: "sample-site") {
  return path.resolve(__dirname, `fixtures/${name}/.downloader`)
}
export async function buildNotionCacheWithFixture(name: "sample-site") {
  const cacheDirectory = getFixture(name)
  const notionCache = new NotionCache({
    cacheDirectory,
  })
  await notionCache.loadCache()
  return Promise.resolve(notionCache)
}

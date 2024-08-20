import { beforeEach, describe, expect, it } from "vitest"

import { NotionCache } from "../src/NotionCache"
import { getFixture } from "./fixtureUtils"
import { createTempDir } from "./utils"

describe("NotionCache - Blocks", () => {
  // Loads from the fixture Sample-Site before each test

  it("gets a hit for existent block", async () => {
    const notionClient = await buildClientWithFixture("sample-site")
    const block = notionClient.getBlock("9deade73-f736-423e-b649-6628b3efeaa3")
    expect(block).toBeDefined()
  })
  it("gets a miss for non-existent block", async () => {
    const notionClient = await buildClientWithFixture("sample-site")
    const block = notionClient.getBlock("non-existent-block")
    expect(block).toBeUndefined()
  })
})

describe("NotionCache - Persistance", () => {
  it("saves cache to file system and loads it back", async () => {
    const cacheDirectory = await createTempDir()
    const blocksChildrenCache = { foo: "bar" } as any
    const databaseChildrenCache = { baz: "qux" } as any
    const databaseObjectsCache = { grault: "garply" } as any
    const blockObjectsCache = { waldo: "fred" } as any
    const pageObjectsCache = { quux: "corge" } as any
    const notionCacheFiles = new NotionCache({
      cacheDirectory,
      blocksChildrenCache,
      databaseChildrenCache,
      pageObjectsCache,
      databaseObjectsCache,
      blockObjectsCache,
    })
    // Set some sample cache data

    // Save the cache
    await notionCacheFiles.saveCache()

    const notionCacheFiles2 = new NotionCache({
      cacheDirectory,
    })
    await notionCacheFiles2.loadCache()
    expect(notionCacheFiles2.blocksChildrenCache).toEqual(blocksChildrenCache)
    expect(notionCacheFiles2.databaseChildrenCache).toEqual(
      databaseChildrenCache
    )
    expect(notionCacheFiles2.pageObjectsCache).toEqual(pageObjectsCache)
    expect(notionCacheFiles2.databaseObjectsCache).toEqual(databaseObjectsCache)
    expect(notionCacheFiles2.blockObjectsCache).toEqual(blockObjectsCache)
  })
  it("cleans saved cache from file system", async () => {
    const cacheDirectory = await createTempDir()
    const blocksChildrenCache = { foo: "bar" } as any
    const databaseChildrenCache = { baz: "qux" } as any
    const databaseObjectsCache = { grault: "garply" } as any
    const blockObjectsCache = { waldo: "fred" } as any
    const pageObjectsCache = { quux: "corge" } as any
    const notionCacheFiles = new NotionCache({
      cacheDirectory,
      blocksChildrenCache,
      databaseChildrenCache,
      pageObjectsCache,
      databaseObjectsCache,
      blockObjectsCache,
    })

    // Save the cache
    await notionCacheFiles.saveCache()
    await notionCacheFiles.clearCache()

    const notionCacheFiles2 = new NotionCache({
      cacheDirectory,
    })
    await notionCacheFiles2.loadCache()
    expect(notionCacheFiles2.blocksChildrenCache).toEqual({})
    expect(notionCacheFiles2.databaseChildrenCache).toEqual({})
    expect(notionCacheFiles2.pageObjectsCache).toEqual({})
    expect(notionCacheFiles2.databaseObjectsCache).toEqual({})
    expect(notionCacheFiles2.blockObjectsCache).toEqual({})
  })
})
async function buildClientWithFixture(name: "sample-site") {
  const cacheDirectory = getFixture(name)
  const notionCache = new NotionCache({
    cacheDirectory,
  })
  await notionCache.loadCache()
  return Promise.resolve(notionCache)
}

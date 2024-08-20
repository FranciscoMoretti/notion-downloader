import {
  BlockObjectResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { beforeEach, describe, expect, it } from "vitest"

import { NotionCache } from "../src/NotionCache"
import { getFixture } from "./fixtureUtils"
import { createTempDir } from "./utils"

const sampleSiteReader = await buildNotionCacheWithFixture("sample-site")
// Find a block without children from the cache by iterating over the blocks objects
const blocksObjectsData = Object.values(sampleSiteReader.blockObjectsCache).map(
  (block) => block.data
)
const blockResponse = blocksObjectsData.find((block) => !block.has_children)
const blockWithChildren = blocksObjectsData.find((block) => block.has_children)
// A block can be a nested page, which has page as parent type
const blockChildren = blocksObjectsData.filter(
  (block) => block.parent[block.parent.type] == blockWithChildren?.id
)
const blockChildrenResponse: ListBlockChildrenResponse = {
  type: "block",
  block: {},
  object: "list",
  next_cursor: null,
  has_more: false,
  results: blockChildren,
}

describe("NotionCache - getting and setting blocks", () => {
  // Loads from the fixture Sample-Site before each test

  it("gets a hit for existent block", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    if (!blockResponse) throw new Error("No block found")
    const block = notionClient.getBlock(blockResponse.id)
    expect(block).toBeDefined()
  })
  it("gets a miss for non-existent block", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    const block = notionClient.getBlock("non-existent-block")
    expect(block).toBeUndefined()
  })

  it("sets a block without children", async () => {
    const notionClient = new NotionCache({
      cacheDirectory: "dummy",
    })
    if (!blockResponse) throw new Error("No block found")
    notionClient.setBlock(blockResponse)
    expect(notionClient.getBlock(blockResponse.id)).toStrictEqual(blockResponse)
  })
  it("gets block children from cache", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    if (!blockWithChildren) throw new Error("No block found")
    if (!blockChildrenResponse) throw new Error("No block children found")

    expect(notionClient.getBlockChildren(blockWithChildren.id)).toStrictEqual(
      blockChildrenResponse
    )
  })

  it("set and get block children of block", async () => {
    const notionClient = new NotionCache({
      cacheDirectory: "dummy",
    })
    if (!blockWithChildren) throw new Error("No block found")
    if (!blockChildrenResponse) throw new Error("No block children found")

    notionClient.setBlockChildren(blockWithChildren.id, blockChildrenResponse)
    expect(notionClient.getBlockChildren(blockWithChildren.id)).toStrictEqual(
      blockChildrenResponse
    )
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
async function buildNotionCacheWithFixture(name: "sample-site") {
  const cacheDirectory = getFixture(name)
  const notionCache = new NotionCache({
    cacheDirectory,
  })
  await notionCache.loadCache()
  return Promise.resolve(notionCache)
}

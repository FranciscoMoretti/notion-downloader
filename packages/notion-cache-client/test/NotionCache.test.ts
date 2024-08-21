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
// TODO: This should be loaded straight from the JSON. Use ZOD to validate the JSON. Validation is great for cache saving and loading.
const blocksObjectsData = Object.values(sampleSiteReader.blockObjectsCache).map(
  (block) => block.data
)
const pageObjectsData = Object.values(sampleSiteReader.pageObjectsCache).map(
  (block) => block.data
)
const blockObjectsDataMap = blocksObjectsData.reduce((acc, block) => {
  acc[block.id] = block
  return acc
}, {} as Record<string, BlockObjectResponse>)
const blocksChildrenMap = sampleSiteReader.blocksChildrenCache
const blockResponse = blocksObjectsData[0]
const pageResponse = pageObjectsData[0]
const blockChildrenOfPage = blocksChildrenMap[pageResponse.id].data.children.map(
  (childId) => blockObjectsDataMap[childId]
)
const blockWithChildren = blocksObjectsData.find((block) => block.has_children)!
// A block can be a nested page, which has page as parent type
const blockChildrenOfBlock = blocksChildrenMap[blockWithChildren.id].data.children.map(
  (childId) => blockObjectsDataMap[childId]
)
const blockChildrenOfBlockResponse: ListBlockChildrenResponse = {
  type: "block",
  block: {},
  object: "list",
  next_cursor: null,
  has_more: false,
  results: blockChildrenOfBlock,
}

const blockChildrenOfPageResponse: ListBlockChildrenResponse = {
  type: "block",
  block: {},
  object: "list",
  next_cursor: null,
  has_more: false,
  results: blockChildrenOfPage,
}


describe("NotionCache - block", () => {
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

  it("sets a block and retrieves it", async () => {
    const notionClient = new NotionCache({
      cacheDirectory: "dummy",
    })
    if (!blockResponse) throw new Error("No block found")
    notionClient.setBlock(blockResponse)
    expect(notionClient.getBlock(blockResponse.id)).toStrictEqual(blockResponse)
  })
})

describe("NotionCache - block children", () => {
  it("gets block children from cache", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    if (!blockWithChildren) throw new Error("No block found")
    if (!blockChildrenOfBlockResponse) throw new Error("No block children found")

    expect(notionClient.getBlockChildren(blockWithChildren.id)).toStrictEqual(
      blockChildrenOfBlockResponse
    )
  })

  it("set and get block children of block", async () => {
    const notionClient = new NotionCache({
      cacheDirectory: "dummy",
    })
    if (!blockWithChildren) throw new Error("No block found")
    if (!blockChildrenOfBlockResponse) throw new Error("No block children found")

    notionClient.setBlockChildren(blockWithChildren.id, blockChildrenOfBlockResponse)
    expect(notionClient.getBlockChildren(blockWithChildren.id)).toStrictEqual(
      blockChildrenOfBlockResponse
    )
  })
})

describe("NotionCache - page", () => {
    it("gets a hit for existent page", async () => {
      const notionClient = await buildNotionCacheWithFixture("sample-site")
      if (!pageResponse) throw new Error("No page found")
      const page = notionClient.getPage(pageResponse.id)
      expect(page).toBeDefined()
    })
    it("gets a miss for non-existent page", async () => {
      const notionClient = await buildNotionCacheWithFixture("sample-site")
      const page = notionClient.getPage("non-existent-page")
      expect(page).toBeUndefined()
    })

    it("sets a page and retrieves it", async () => {
      const notionClient = new NotionCache({
        cacheDirectory: "dummy",
      })
      if (!pageResponse) throw new Error("No page found")
      notionClient.setPage(pageResponse)
      expect(notionClient.getPage(pageResponse.id)).toStrictEqual(pageResponse)
    })
})

describe("NotionCache - refresh", () => {
  // Refresh for blocks
  it("If block needs refresh its not retrieved", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    notionClient.setNeedsRefresh()
    if (!blockWithChildren) throw new Error("No block found")
    expect(notionClient.getBlockChildren(blockWithChildren.id)).toBeUndefined()
  })
  it("Setting a block without change refreshes children", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    if (!blockWithChildren) throw new Error("No block found")
    notionClient.setNeedsRefresh()
    notionClient.setBlock(blockWithChildren)
    expect(notionClient.getBlockChildren(blockWithChildren.id)).toStrictEqual(
      blockChildrenOfBlockResponse
    )
  })
  it("setting a block with new date invalidates children", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    if (!blockWithChildren) throw new Error("No block found")
    notionClient.setNeedsRefresh()
    const newDate = new Date(
      new Date(blockWithChildren.last_edited_time).getTime() + 60000
    ).toISOString()

    notionClient.setBlock({
      ...blockWithChildren,
      last_edited_time: newDate,
    })
    expect(notionClient.getBlockChildren(blockWithChildren.id)).toBeUndefined()
  })
  // Refresh for pages
  it("If page needs refresh its not retrieved", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    notionClient.setNeedsRefresh()
    if (!pageResponse) throw new Error("No page found")
    expect(notionClient.getPage(pageResponse.id)).toBeUndefined()
  })
  it("Setting a page without change refreshes children", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    if (!pageResponse) throw new Error("No page found")
    notionClient.setNeedsRefresh()
    notionClient.setPage(pageResponse)
    expect(notionClient.getPage(pageResponse.id)).toStrictEqual(pageResponse)
    expect(notionClient.getBlockChildren(pageResponse.id)).toStrictEqual(
      blockChildrenOfPageResponse
    )
  })
  it("setting a page with new date invalidates children", async () => {
    const notionClient = await buildNotionCacheWithFixture("sample-site")
    if (!pageResponse) throw new Error("No page found")
      notionClient.setNeedsRefresh()
    const newDate = new Date(
      new Date(pageResponse.last_edited_time).getTime() + 60000
    ).toISOString()

    notionClient.setPage({
      ...pageResponse,
      last_edited_time: newDate,
    })
    expect(notionClient.getBlockChildren(pageResponse.id)).toBeUndefined()
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

import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  PageObjectResponse,
  QueryDatabaseResponse,
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
const databaseObjectsData = Object.values(sampleSiteReader.databaseObjectsCache).map(
  (block) => block.data
)
const blockObjectsDataMap = blocksObjectsData.reduce((acc, block) => {
  acc[block.id] = block
  return acc
}, {} as Record<string, BlockObjectResponse>)
const pageObjectsDataMap = pageObjectsData.reduce((acc, page) => {
  acc[page.id] = page
  return acc
}, {} as Record<string, PageObjectResponse>)
const databaseObjectsDataMap = databaseObjectsData.reduce((acc, database) => {
  acc[database.id] = database
  return acc
}, {} as Record<string, DatabaseObjectResponse>)


const blocksChildrenMap = sampleSiteReader.blocksChildrenCache
const databaseChildrenMap = sampleSiteReader.databaseChildrenCache
const blockResponse = blocksObjectsData[0]
const pageResponse = pageObjectsData[0]
const databaseResponse = databaseObjectsData[0]
const pageOrDatabaseChildrenOfDatabase = databaseChildrenMap[databaseResponse.id].data.children.map<(PageObjectResponse|DatabaseObjectResponse)>(
  (childId) => pageObjectsDataMap[childId] || databaseObjectsDataMap[childId]
)
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

const pageOrDatabaseChildrenOfDatabaseResponse: QueryDatabaseResponse  = {
  type: "page_or_database",
  page_or_database: {},
  object: "list",
  next_cursor: null,
  has_more: false,
  results: pageOrDatabaseChildrenOfDatabase,
}


describe("NotionCache - block", () => {
  it("gets a hit for existent block", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!blockResponse) throw new Error("No block found")
    const block = notionCache.getBlock(blockResponse.id)
    expect(block).toBeDefined()
  })
  it("gets a miss for non-existent block", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    const block = notionCache.getBlock("non-existent-block")
    expect(block).toBeUndefined()
  })

  it("sets a block and retrieves it", async () => {
    const notionCache = new NotionCache({
      cacheDirectory: "dummy",
    })
    if (!blockResponse) throw new Error("No block found")
    notionCache.setBlock(blockResponse)
    expect(notionCache.getBlock(blockResponse.id)).toStrictEqual(blockResponse)
  })
})

describe("NotionCache - block children", () => {
  it("gets block children from cache", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!blockWithChildren) throw new Error("No block found")
    if (!blockChildrenOfBlockResponse) throw new Error("No block children found")

    expect(notionCache.getBlockChildren(blockWithChildren.id)).toStrictEqual(
      blockChildrenOfBlockResponse
    )
  })

  it("set and get block children of block", async () => {
    const notionCache = new NotionCache({
      cacheDirectory: "dummy",
    })
    if (!blockWithChildren) throw new Error("No block found")
    if (!blockChildrenOfBlockResponse) throw new Error("No block children found")

    notionCache.setBlockChildren(blockWithChildren.id, blockChildrenOfBlockResponse)
    expect(notionCache.getBlockChildren(blockWithChildren.id)).toStrictEqual(
      blockChildrenOfBlockResponse
    )
  })
})

describe("NotionCache - page", () => {
    it("gets a hit for existent page", async () => {
      const notionCache = await buildNotionCacheWithFixture("sample-site")
      if (!pageResponse) throw new Error("No page found")
      const page = notionCache.getPage(pageResponse.id)
      expect(page).toBeDefined()
    })
    it("gets a miss for non-existent page", async () => {
      const notionCache = await buildNotionCacheWithFixture("sample-site")
      const page = notionCache.getPage("non-existent-page")
      expect(page).toBeUndefined()
    })

    it("sets a page and retrieves it", async () => {
      const notionCache = new NotionCache({
        cacheDirectory: "dummy",
      })
      if (!pageResponse) throw new Error("No page found")
      notionCache.setPage(pageResponse)
      expect(notionCache.getPage(pageResponse.id)).toStrictEqual(pageResponse)
    })
})


describe("NotionCache - database", () => {
  it("gets a hit for existent database", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!databaseResponse) throw new Error("No database found")
    const database = notionCache.getDatabase(databaseResponse.id)
    expect(database).toBeDefined()
  })
  it("gets a miss for non-existent database", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    const database = notionCache.getDatabase("non-existent-database")
    expect(database).toBeUndefined()
  })

  it("sets a database and retrieves it", async () => {
    const notionCache = new NotionCache({
      cacheDirectory: "dummy",
    })
    if (!databaseResponse) throw new Error("No database found")
    notionCache.setDatabase(databaseResponse)
    expect(notionCache.getDatabase(databaseResponse.id)).toStrictEqual(databaseResponse)
  })
})

describe("NotionCache - database children", () => {
  it("gets database children from cache", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!databaseResponse) throw new Error("No database found")
    if (!pageOrDatabaseChildrenOfDatabaseResponse) throw new Error("No database children found")

    expect(notionCache.getDatabaseChildren(databaseResponse.id)).toStrictEqual(
      pageOrDatabaseChildrenOfDatabaseResponse
    )
  })

  it("set and get database children of database", async () => {
    const notionCache = new NotionCache({
      cacheDirectory: "dummy",
    })
    if (!databaseResponse) throw new Error("No database found")
    if (!blockChildrenOfPageResponse) throw new Error("No database children found")

    notionCache.setDatabaseChildren(
      databaseResponse.id,
      pageOrDatabaseChildrenOfDatabaseResponse
    )
    expect(notionCache.getDatabaseChildren(databaseResponse.id)).toStrictEqual(
      pageOrDatabaseChildrenOfDatabaseResponse
    )
  })
})



describe("NotionCache - refresh", () => {
  // Refresh for blocks and blocks children
  it("If block needs refresh its not retrieved", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    notionCache.setNeedsRefresh()
    if (!blockWithChildren) throw new Error("No block found")
    expect(notionCache.getBlockChildren(blockWithChildren.id)).toBeUndefined()
  })
  it("Setting a block without change refreshes children", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!blockWithChildren) throw new Error("No block found")
    notionCache.setNeedsRefresh()
    notionCache.setBlock(blockWithChildren)
    expect(notionCache.getBlockChildren(blockWithChildren.id)).toStrictEqual(
      blockChildrenOfBlockResponse
    )
  })
  it("setting a block with new date invalidates children", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!blockWithChildren) throw new Error("No block found")
    notionCache.setNeedsRefresh()
    const newDate = new Date(
      new Date(blockWithChildren.last_edited_time).getTime() + 60000
    ).toISOString()

    notionCache.setBlock({
      ...blockWithChildren,
      last_edited_time: newDate,
    })
    expect(notionCache.getBlockChildren(blockWithChildren.id)).toBeUndefined()
  })
  // Refresh for pages
  it("If page needs refresh its not retrieved", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    notionCache.setNeedsRefresh()
    if (!pageResponse) throw new Error("No page found")
    expect(notionCache.getPage(pageResponse.id)).toBeUndefined()
  })
  it("Setting a page without change refreshes itself and its children", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!pageResponse) throw new Error("No page found")
    notionCache.setNeedsRefresh()
    notionCache.setPage(pageResponse)
    expect(notionCache.getPage(pageResponse.id)).toStrictEqual(pageResponse)
    expect(notionCache.getBlockChildren(pageResponse.id)).toStrictEqual(
      blockChildrenOfPageResponse
    )
  })
  it("setting a page with new date refreshes itself and invalidates children", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!pageResponse) throw new Error("No page found")
    const newDate = new Date(
      new Date(pageResponse.last_edited_time).getTime() + 60000
    ).toISOString()

    const moreRecentPageResponse = {
      ...pageResponse,
      last_edited_time: newDate,
    }
    notionCache.setPage(moreRecentPageResponse)
    expect(notionCache.getPage(pageResponse.id)).toStrictEqual(moreRecentPageResponse)
    expect(notionCache.getBlockChildren(pageResponse.id)).toBeUndefined()
  })
  // Refresh for database
  it("If database needs refresh its not retrieved", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    notionCache.setNeedsRefresh()
    if (!databaseResponse) throw new Error("No database found")
    expect(notionCache.getDatabase(databaseResponse.id)).toBeUndefined()
  })
  it("Setting a database without change refreshes itself but not its children", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!databaseResponse) throw new Error("No database found")
    notionCache.setNeedsRefresh()
    notionCache.setDatabase(databaseResponse)
    expect(notionCache.getDatabase(databaseResponse.id)).toStrictEqual(
      databaseResponse
    )
    expect(notionCache.getDatabaseChildren(databaseResponse.id)).toBeUndefined()
  })
  it("setting a database with new date refreshes itself but not its children", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!databaseResponse) throw new Error("No database found")
    const newDate = new Date(
      new Date(databaseResponse.last_edited_time).getTime() + 60000
    ).toISOString()

    const moreRecentDatabaseResponse = {
      ...databaseResponse,
      last_edited_time: newDate,
    }
    notionCache.setDatabase(moreRecentDatabaseResponse)
    expect(notionCache.getDatabase(databaseResponse.id)).toStrictEqual(
      moreRecentDatabaseResponse
    )
    // TODO: verify this logic. Not too sure it it gives us any info about its children
    expect(notionCache.getDatabaseChildren(databaseResponse.id)).toBeDefined()
  })
  // Database Children
  it("If database children needs refresh its not retrieved", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    notionCache.setNeedsRefresh()
    if (!databaseResponse) throw new Error("No database found")
    expect(notionCache.getDatabaseChildren(databaseResponse.id)).toBeUndefined()
  })
  it("Setting a database children without change refreshes itself and its child pages and databases", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!databaseResponse) throw new Error("No database found")
    notionCache.setNeedsRefresh()
    notionCache.setDatabaseChildren(
      databaseResponse.id,
      pageOrDatabaseChildrenOfDatabaseResponse
    )
    expect(notionCache.getDatabaseChildren(databaseResponse.id)).toStrictEqual(
      pageOrDatabaseChildrenOfDatabaseResponse
    )
    const childPagesOrDatabases = pageOrDatabaseChildrenOfDatabaseResponse.results
    childPagesOrDatabases.forEach((child) => {
      expect(notionCache.getPage(child.id)).toStrictEqual(child)
    })
  })
  it("setting a database children refreshes children by children based on its date", async () => {
    const notionCache = await buildNotionCacheWithFixture("sample-site")
    if (!databaseResponse) throw new Error("No database found")
      // TODO Extract as add to edited time function
    const newDate = new Date(
      new Date(databaseResponse.last_edited_time).getTime() + 60000
    ).toISOString()

    // Modify the date of one of the children
    const firstChild = pageOrDatabaseChildrenOfDatabaseResponse.results[0]
    const moreRecentChild = {
      ...firstChild,
      last_edited_time: newDate,
    }
    const moreRecentDatabaseResponse = {
      ...pageOrDatabaseChildrenOfDatabaseResponse,
      results: [moreRecentChild, ...pageOrDatabaseChildrenOfDatabaseResponse.results.slice(1)],
    }
    notionCache.setDatabaseChildren(
      databaseResponse.id,
      moreRecentDatabaseResponse
    )
    expect(
      notionCache.getDatabaseChildren(databaseResponse.id)
    ).toStrictEqual(moreRecentDatabaseResponse)
    // The changed child is updated in cache
    expect(notionCache.getPage(firstChild.id)).toStrictEqual(moreRecentChild)
    // Its child blocks are removed from cache
    expect(notionCache.getBlockChildren(firstChild.id)).toBeUndefined()
    // The other children are not updated in cache and its child block are not removed
    pageOrDatabaseChildrenOfDatabaseResponse.results.slice(1).forEach((child) => {
      expect(notionCache.getPage(child.id)).toStrictEqual(child)
      expect(notionCache.getBlockChildren(child.id)).toBeDefined()
    })
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

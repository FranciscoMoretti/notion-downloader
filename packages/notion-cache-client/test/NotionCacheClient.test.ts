import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { beforeEach, describe, expect, it, vi} from "vitest"

import { NotionCacheClient } from "../src/notion-cache-client"
import { createTempDir } from "./utils"
import { buildNotionCacheClientWithFixture } from "./fixtureUtils"
import { addSecondsToIsoString } from "./utils"

const sampleSiteReader = await buildNotionCacheClientWithFixture("sample-site")
// Find a block without children from the cache by iterating over the blocks objects
// TODO: This should be loaded straight from the JSON. Use ZOD to validate the JSON. Validation is great for cache saving and loading.
const blocksObjectsData = Object.values(sampleSiteReader.cache.blockObjectsCache).map(
  (block) => block.data
)
const pageObjectsData = Object.values(sampleSiteReader.cache.pageObjectsCache).map(
  (block) => block.data
)
const databaseObjectsData = Object.values(sampleSiteReader.cache.databaseObjectsCache).map(
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


const blocksChildrenMap = sampleSiteReader.cache.blocksChildrenCache
const databaseChildrenMap = sampleSiteReader.cache.databaseChildrenCache
const blockResponse = blocksObjectsData[0]
const pageResponse = pageObjectsData[0]
export const databaseResponse = databaseObjectsData[0]
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


describe("NotionCacheClient - block", () => {
  it("gets a hit for existent block", async () => {
    const notionClient = await buildNotionCacheClientWithFixture("sample-site")
    // Create a spy function with vitest
    const spy = vi.spyOn(notionClient.notionClient.blocks, "retrieve")
    if (!blockResponse) throw new Error("No block found")
      const block = await notionClient.blocks.retrieve({ block_id: blockResponse.id })
    // Check that the retrieve block from notionClient method is not being called
    expect(spy).not.toHaveBeenCalled()
    expect(block).toBeDefined()
  })
  it("gets a miss from cache and uses notion-api for non-existent block", async () => {
    const notionClient = await buildNotionCacheClientWithFixture("sample-site")
    // Create a spy function with vitest
    const spy = vi.spyOn(notionClient.notionClient.blocks, "retrieve").mockResolvedValue(blockResponse)
    await notionClient.blocks.retrieve({block_id:"non-existent-block"})
    expect(spy).toHaveBeenCalledOnce()
  })

  it("after getting the block once, it gets it from the cache the next time", async () => {
    const notionClient = new NotionCacheClient({
      auth: "dummy",
      cacheOptions: {cacheDirectory: "dummy"},
    })
    if (!blockResponse) throw new Error("No block found")
      const spy = vi.spyOn(notionClient.notionClient.blocks, "retrieve").mockResolvedValueOnce(blockResponse)
      const block1 = await notionClient.blocks.retrieve({ block_id: blockResponse.id })
      const block2 = await notionClient.blocks.retrieve({ block_id: blockResponse.id })
      expect(block1).toStrictEqual(block2)
      expect(spy).toHaveBeenCalledOnce()
    })
})


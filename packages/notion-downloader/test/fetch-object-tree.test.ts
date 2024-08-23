import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionCacheClient } from "notion-cache-client"
import { beforeEach, describe, expect, it } from "vitest"

import {
  StartingNode,
  fetchNotionObjectTree,
} from "../src/fetch-notion-object-tree"
import {
  groupIdsByType,
  idFromIdWithType,
  objectTreeToObjectIds,
  objectTreeToPlainObjects,
} from "../src/object-tree-utils"
import {
  buildNotionCacheClientWithFixture,
  buildNotionCacheWithFixture,
} from "./fixtureUtils"
import { addSecondsToIsoString, createTempDir } from "./utils"

const sampleSiteReader = await buildNotionCacheWithFixture("sample-site")
// Find a block without children from the cache by iterating over the blocks objects
// TODO: This should be loaded straight from the JSON. Use ZOD to validate the JSON. Validation is great for cache saving and loading.
const blocksObjectsData = Object.values(sampleSiteReader.blockObjectsCache).map(
  (block) => block.data
)
const pageObjectsData = Object.values(sampleSiteReader.pageObjectsCache).map(
  (block) => block.data
)
const databaseObjectsData = Object.values(
  sampleSiteReader.databaseObjectsCache
).map((block) => block.data)
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
export const databaseResponse = databaseObjectsData[0]
const pageOrDatabaseChildrenOfDatabase = databaseChildrenMap[
  databaseResponse.id
].data.children.map<PageObjectResponse | DatabaseObjectResponse>(
  (childId) => pageObjectsDataMap[childId] || databaseObjectsDataMap[childId]
)
const blockChildrenOfPage = blocksChildrenMap[
  pageResponse.id
].data.children.map((childId) => blockObjectsDataMap[childId])
const blockWithChildren = blocksObjectsData.find((block) => block.has_children)!
// A block can be a nested page, which has page as parent type
const blockChildrenOfBlock = blocksChildrenMap[
  blockWithChildren.id
].data.children.map((childId) => blockObjectsDataMap[childId])
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

const pageOrDatabaseChildrenOfDatabaseResponse: QueryDatabaseResponse = {
  type: "page_or_database",
  page_or_database: {},
  object: "list",
  next_cursor: null,
  has_more: false,
  results: pageOrDatabaseChildrenOfDatabase,
}

function isRootForThisTree(id: string) {
  const parent =
    databaseObjectsDataMap[id]?.parent || pageObjectsDataMap[id]?.parent
  if (
    parent.type === "workspace" ||
    (parent.type === "page_id" && !pageObjectsDataMap[parent.page_id]) ||
    (parent.type === "database_id" &&
      !databaseObjectsDataMap[parent.database_id]) ||
    (parent.type === "block_id" && !blockObjectsDataMap[parent.block_id])
  ) {
    return true
  }
  return false
}

const rootDatabase = Object.keys(databaseObjectsDataMap).find((id) =>
  isRootForThisTree(id)
)

const rootPage = Object.keys(pageObjectsDataMap).find((id) =>
  isRootForThisTree(id)
)

// Specific to fetch object tree
const startingNode: StartingNode = {
  rootUUID: rootDatabase || rootPage || "",
  rootObjectType: rootDatabase ? "database" : "page",
}

const commonDataOptions = {
  downloadAllPages: true,
  downloadDatabases: true,
  followLinks: true,
}

describe("FetchTreeRecursively", () => {
  it("Builds an object tree starting from the root that contains all the objects", async () => {
    const notionCacheClient = await buildNotionCacheClientWithFixture(
      "sample-site"
    )
    const objectTree = await fetchNotionObjectTree({
      startingNode: startingNode,
      client: notionCacheClient,
      dataOptions: commonDataOptions,
    })
    expect(objectTree).toBeDefined()
    const { database_id, page_id, block_id } = groupIdsByType(
      objectTreeToObjectIds(objectTree)
    )

    expect(toSorted(database_id)).toEqual(
      toSorted(Object.keys(databaseObjectsDataMap))
    )
    expect(toSorted(page_id)).toEqual(toSorted(Object.keys(pageObjectsDataMap)))
    expect(toSorted(block_id)).toEqual(
      toSorted(Object.keys(blockObjectsDataMap))
    )
  })

  it("The tree contains the correct parent-child relationships", async () => {
    const notionCacheClient = await buildNotionCacheClientWithFixture(
      "sample-site"
    )
    const objectTree = await fetchNotionObjectTree({
      startingNode: startingNode,
      client: notionCacheClient,
      dataOptions: commonDataOptions,
    })
    expect(objectTree).toBeDefined()
    const plainObjects = objectTreeToPlainObjects(objectTree)
    expect(plainObjects).toBeDefined()
    const plainObjectsMap = plainObjects.reduce((acc, plainObject) => {
      acc[plainObject.id] = plainObject
      return acc
    }, {} as Record<string, any>)

    function expectParentInObjects(
      object: BlockObjectResponse | PageObjectResponse | DatabaseObjectResponse
    ) {
      const parent = object.parent
      if (parent.type !== "workspace") {
        expect(plainObjectsMap[idFromIdWithType(parent)].children).toContain(
          object.id
        )
      }
    }
    Object.values(blockObjectsDataMap).forEach(expectParentInObjects)
    Object.values(pageObjectsDataMap).forEach(expectParentInObjects)
    Object.values(databaseObjectsDataMap).forEach(expectParentInObjects)
  })
})

function toSorted(arr: any[]) {
  return [...arr].sort()
}
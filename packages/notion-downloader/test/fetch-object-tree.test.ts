import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints"
import {
  NotionCacheClient,
  convertToUUID,
  simplifyParentObject,
} from "notion-cache-client"
import { beforeEach, describe, expect, it } from "vitest"

import {
  StartingNode,
  fetchNotionObjectTreeStructure,
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

const sampleSiteReader = await buildNotionCacheWithFixture("sample-site")

// TODO: Find a way to share root page with fixture from single source of truth
const rootObject: {
  id: string
  object: "page" | "database"
} = {
  id: convertToUUID("74fe3069cc484ee5b94fb76bd67732ae"),
  object: "page",
}

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

// Specific to fetch object tree
const startingNode: StartingNode = {
  rootUUID: rootObject.id,
  rootObjectType: rootObject.object,
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
    const objectTree = await fetchNotionObjectTreeStructure({
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
    const objectTree = await fetchNotionObjectTreeStructure({
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
      if (object.id === rootObject.id) {
        return
      }
      if (object.parent.type !== "workspace") {
        const parent = simplifyParentObject(object.parent)
        if (!parent) {
          throw new Error(
            `Object ${object.id} has an inconsistent parent value: ${object.parent}`
          )
        }
        const objectOfId = plainObjectsMap[parent.id]
        if (!objectOfId) {
          throw new Error(
            `Object ${object.id} has a parent ${parent.object} that is not in the plain objects map`
          )
        }
        expect(objectOfId.children).toContain(object.id)
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

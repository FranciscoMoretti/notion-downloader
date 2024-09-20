import { collectPaginatedAPI, isFullBlock } from "@notionhq/client"
import {
  ListBlockChildrenParameters,
  QueryDatabaseParameters,
} from "@notionhq/client/build/src/api-endpoints"
import {
  CacheType,
  NotionCacheClient,
  ObjectType,
  PageOrDatabase,
  logOperation,
} from "notion-cache-client"
import { z } from "zod"

import { NotionObjectTree, NotionObjectTreeNode } from "./notion-object-tree"
import { getAllObjectsInObjectsTree } from "./objectTreeUtills"
import { cacheOptionsSchema } from "./schema"

// TODO: Consider making this compatible with client by returning more data

interface DownloadObjectsOptions {
  downloadAllPages?: boolean
  downloadDatabases?: boolean
  followLinks?: boolean
}

export interface StartingNode {
  rootUUID: string
  rootObjectType: PageOrDatabase
}

interface FetchingOptions {
  client: NotionCacheClient
  startingNode: StartingNode
  dataOptions: DownloadObjectsOptions
}

// Infer CachingOptions from cacheOptionsSchema

export type CachingOptions = z.infer<typeof cacheOptionsSchema>

type DownloadOptions = FetchingOptions & {
  cachingOptions: CachingOptions
}

export async function downloadNotionObjectTree(
  cachedNotionClient: NotionCacheClient,
  startingNode: StartingNode,
  cachingOptions: CachingOptions
) {
  // Page tree that stores relationship between pages and their children. It can store children recursively in any depth.
  const objectsTreeRootNode = await fetchTreeStructureWithCache({
    client: cachedNotionClient,
    startingNode: startingNode,
    dataOptions: {
      // TODO: Consider exposing this as options or making it a default input arg
      downloadAllPages: true,
      downloadDatabases: true,
      followLinks: true,
    },
    cachingOptions: cachingOptions,
  })

  const objectsData = await getAllObjectsInObjectsTree(
    objectsTreeRootNode,
    cachedNotionClient
  )
  return new NotionObjectTree(objectsTreeRootNode, objectsData)
}

export async function fetchTreeStructureWithCache({
  client,
  startingNode,
  dataOptions,
  cachingOptions,
}: DownloadOptions): Promise<NotionObjectTreeNode> {
  // TODO Implement the StorageOptions with loadCache and saveCache functions and create a cleanup func
  if (cachingOptions.cleanCache) {
    await client.cache.clearCache()
  } else {
    if (cachingOptions.cacheStrategy === "cache") {
      await client.cache.loadCache()
      client.cache.setNeedsRefresh()
    } else if (cachingOptions.cacheStrategy === "force-cache") {
      await client.cache.loadCache()
    } else if (cachingOptions.cacheStrategy === "no-cache") {
      // Do nothing
    } else {
      throw new Error(`Unknown cache strategy ${cachingOptions.cacheStrategy}`)
    }
  }

  // Page tree that stores relationship between pages and their children. It can store children recursively in any depth.
  const objectsTree: NotionObjectTreeNode =
    await fetchNotionObjectTreeStructure({
      client: client,
      startingNode: startingNode,
      dataOptions: dataOptions,
    })

  if (["cache", "force-cache"].includes(cachingOptions.cacheStrategy)) {
    await client.cache.saveCache()
  }
  return objectsTree
}

export async function fetchNotionObjectTreeStructure({
  startingNode,
  client,
  dataOptions: options,
}: FetchingOptions): Promise<NotionObjectTreeNode> {
  const objectsTree: NotionObjectTreeNode = {
    id: startingNode.rootUUID,
    object: startingNode.rootObjectType,
    children: [],
    parent: null,
  }

  await fetchTreeRecursively(objectsTree, 0, client, options)
  return objectsTree
}

export async function fetchTreeRecursively(
  objectNode: NotionObjectTreeNode,
  level: number,
  client: NotionCacheClient,
  options?: DownloadObjectsOptions
) {
  if (
    objectNode.object === ObjectType.enum.database ||
    (objectNode.object === ObjectType.enum.block &&
      objectNode.type === "child_database")
  ) {
    if (options?.downloadDatabases) {
      // Fetching to add it to the cache. Fetching the page object is not needed to recurse, only the block children.
      logOperation({
        level: level,
        source: "WALKER",
        operation: "RETRIEVE",
        resource_type: objectNode.object,
        id: objectNode.id,
      })
      const databaseResponse = await client.databases.retrieve(
        {
          database_id: objectNode.id,
        },
        level + 1
      )
    }

    // TODO: Decide how to process a child_database block that also has children.
    logOperation({
      level: level,
      source: "WALKER",
      operation: "RETRIEVE",
      resource_type: CacheType.DATABASE_CHILDREN,
      id: objectNode.id,
    })
    const databaseChildrenResults = await collectPaginatedAPI(
      (args: QueryDatabaseParameters) =>
        client.databases.query(args, level + 1),
      {
        database_id: objectNode.id,
      }
    )
    for (const childObject of databaseChildrenResults) {
      const newNode: NotionObjectTreeNode = {
        id: childObject.id,
        object: PageOrDatabase.parse(childObject.object),
        children: [],
        parent: {
          id: objectNode.id,
          object: objectNode.object,
        },
      }

      objectNode.children.push(newNode)
      await fetchTreeRecursively(newNode, level + 1, client, options)
    }
  } else if (
    objectNode.object === ObjectType.enum.page ||
    (objectNode.object === ObjectType.enum.block &&
      objectNode.type === "child_page") ||
    (objectNode.object === ObjectType.enum.block && objectNode.has_children)
  ) {
    if (
      objectNode.object === ObjectType.enum.page ||
      (objectNode.object === ObjectType.enum.block &&
        objectNode.type === "child_page")
    ) {
      // Fetching to add it to the cache. Fetching the page object is not needed to recurse, only the block children.
      if (options?.downloadAllPages) {
        logOperation({
          level: level,
          source: "WALKER",
          operation: "RETRIEVE",
          resource_type: objectNode.object,
          id: objectNode.id,
        })
        const pageResponse = await client.pages.retrieve(
          {
            page_id: objectNode.id,
          },
          level + 1
        )
      }
    }

    logOperation({
      level: level,
      source: "WALKER",
      operation: "RETRIEVE",
      resource_type: CacheType.BLOCKS_CHILDREN,
      id: objectNode.id,
    })
    const blocksChildrenResults = await collectPaginatedAPI(
      (args: ListBlockChildrenParameters) =>
        client.blocks.children.list(args, level + 1),
      {
        block_id: objectNode.id,
      }
    )
    for (const childBlock of blocksChildrenResults) {
      if (!isFullBlock(childBlock)) {
        throw new Error(`Non full block: ${JSON.stringify(childBlock)}`)
      }
      const newNode: NotionObjectTreeNode = {
        id: childBlock.id,
        object: ObjectType.enum.block,
        children: [],
        has_children: childBlock.has_children,
        type: childBlock.type,
        parent: {
          id: objectNode.id,
          object: objectNode.object,
        },
      }
      objectNode.children.push(newNode)
      if (
        // TODO: Decide how to handle "mentions" (links to other objects)
        childBlock.type == "child_page" ||
        childBlock.type == "child_database" ||
        childBlock.has_children
      ) {
        // Recurse if page or database (with children)
        await fetchTreeRecursively(newNode, level + 1, client, options)
      }
    }
  }
}

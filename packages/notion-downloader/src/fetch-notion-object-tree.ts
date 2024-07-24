import { Client, isFullBlock } from "@notionhq/client"
import { NotionCacheClient } from "notion-cache-client"

import { info } from "./log"
import { NotionObjectTreeNode } from "./notion-object-tree"

// TODO: Consider making this compatible with client by returning more data

interface DownloadObjectsOptions {
  downloadAllPages?: boolean
  downloadDatabases?: boolean
  followLinks?: boolean
}

interface StartingNode {
  rootPageUUID: string
  rootIsDb: boolean
}

interface FetchingOptions {
  client: NotionCacheClient
  startingNode: StartingNode
  options: DownloadObjectsOptions
}

export async function fetchNotionObjectTree({
  startingNode,
  client,
  options,
}: FetchingOptions) {
  const objectsTree: NotionObjectTreeNode = {
    id: startingNode.rootPageUUID,
    object: startingNode.rootIsDb ? "database" : "page",
    children: [],
  }

  await fetchTreeRecursively(objectsTree, client, options)
  return objectsTree
}

async function fetchTreeRecursively(
  objectNode: NotionObjectTreeNode,
  client: Client,
  options?: DownloadObjectsOptions
) {
  info(
    `Looking for children of {object_id: "${objectNode.id}", object: "${objectNode.object}"}`
  )

  if (
    objectNode.object === "database" ||
    (objectNode.object === "block" && objectNode.type === "child_database")
  ) {
    if (options?.downloadDatabases) {
      // Fetching to add it to the cache. Fetching the page object is not needed to recurse, only the block children.
      const databaseResponse = await client.databases.retrieve({
        database_id: objectNode.id,
      })
    }

    // TODO: Decide how to process a child_database block that also has children.
    const databaseResponse = await client.databases.query({
      database_id: objectNode.id,
    })
    for (const childObject of databaseResponse.results) {
      const newNode: NotionObjectTreeNode = {
        id: childObject.id,
        object: childObject.object,
        children: [],
      }

      objectNode.children.push(newNode)
      await fetchTreeRecursively(newNode, client, options)
    }
  } else if (
    objectNode.object === "page" ||
    (objectNode.object === "block" && objectNode.type === "child_page") ||
    (objectNode.object === "block" && objectNode.has_children)
  ) {
    if (
      options?.downloadAllPages &&
      (objectNode.object === "page" ||
        (objectNode.object === "block" && objectNode.type === "child_page"))
    ) {
      // Fetching to add it to the cache. Fetching the page object is not needed to recurse, only the block children.
      const pageResponse = await client.pages.retrieve({
        page_id: objectNode.id,
      })
    }

    const blocksResponse = await client.blocks.children.list({
      block_id: objectNode.id,
    })
    for (const childBlock of blocksResponse.results) {
      if (!isFullBlock(childBlock)) {
        throw new Error(`Non full block: ${JSON.stringify(childBlock)}`)
      }
      const newNode: NotionObjectTreeNode = {
        id: childBlock.id,
        object: childBlock.object,
        children: [],
        has_children: childBlock.has_children,
        type: childBlock.type,
      }
      objectNode.children.push(newNode)
      if (
        // TODO: Decide how to handle "mentions" (links to other objects)
        childBlock.type == "child_page" ||
        childBlock.type == "child_database" ||
        childBlock.has_children
      ) {
        // Recurse if page or database (with children)
        await fetchTreeRecursively(newNode, client, options)
      }
    }
  }
}

import {
  Client,
  collectPaginatedAPI,
  isFullDatabase,
  isFullPage,
} from "@notionhq/client"

import { FilesManager } from "./FilesManager"
import { LayoutStrategy } from "./LayoutStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage, getPageContentInfo } from "./NotionPage"

export async function getFileTreeMap(
  currentPath: string,
  currentID: string,
  currentType: "page" | "database",
  databaseIsRootLevel: boolean,
  client: Client,
  layoutStrategy: LayoutStrategy,
  filesManager: FilesManager
): Promise<void> {
  if (currentType === "database") {
    const database = await getNotionDatabase(client, currentID)
    const newLevelPath = !databaseIsRootLevel
      ? layoutStrategy.newLevel(currentPath, database)
      : currentPath
    filesManager.set("base", "database", currentID, {
      path: newLevelPath,
      lastEditedTime: database.lastEditedTime,
    })

    // Recurse to children
    const databaseChildrenResults = await collectPaginatedAPI(
      client.databases.query,
      {
        database_id: currentID,
      }
    )
    for (const childObject of databaseChildrenResults) {
      // TODO: Consider using just id from objectTreeMap instead of the database query here
      await getFileTreeMap(
        newLevelPath,
        childObject.id,
        childObject.object,
        false,
        client,
        layoutStrategy,
        filesManager
      )
    }
  } else if (currentType === "page") {
    const page = await getNotionPage(client, currentID)
    filesManager.set("base", "page", currentID, {
      path: layoutStrategy.getPathForPage(page, currentPath),
      lastEditedTime: page.lastEditedTime,
    })

    // Recurse to children

    const pageBlocksResults = await collectPaginatedAPI(
      client.blocks.children.list,
      {
        block_id: currentID,
      }
    )
    const pageContentInfo = await getPageContentInfo(pageBlocksResults)
    // TODO: Also handle blocks that have block/page children (e.g. columns)
    if (
      pageContentInfo.childDatabaseIdsAndOrder ||
      pageContentInfo.childPageIdsAndOrder
    ) {
      const newLevelPath = layoutStrategy.newLevel(currentPath, page)
      // TODO: Consolidate these as generic object children, instead of using the `pageContentInfo`
      for (const page of pageContentInfo.childPageIdsAndOrder) {
        await getFileTreeMap(
          newLevelPath,
          page.id,
          "page",
          false,
          client,
          layoutStrategy,
          filesManager
        )
      }
      for (const database of pageContentInfo.childDatabaseIdsAndOrder) {
        await getFileTreeMap(
          newLevelPath,
          database.id,
          "database",
          false,
          client,
          layoutStrategy,
          filesManager
        )
      }
    }
  } else {
    throw new Error(`Unknown type ${currentType}`)
  }
}
export async function getNotionPage(client: Client, currentID: string) {
  const pageResponse = await client.pages.retrieve({ page_id: currentID })
  if (!isFullPage(pageResponse)) {
    throw Error("Notion page response is not full for " + currentID)
  }
  return new NotionPage(pageResponse)
}
export async function getNotionDatabase(client: Client, currentID: string) {
  const databaseResponse = await client.databases.retrieve({
    database_id: currentID,
  })
  if (!isFullDatabase(databaseResponse)) {
    throw Error("Notion database response is not full for " + currentID)
  }
  return new NotionDatabase(databaseResponse)
}

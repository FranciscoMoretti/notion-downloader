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
  incomingContext: string,
  currentID: string,
  currentType: "page" | "database",
  databaseIsRootLevel: boolean,
  client: Client,
  layoutStrategy: LayoutStrategy,
  filesManager: FilesManager
): Promise<void> {
  if (currentType === "database") {
    const database = await getNotionDatabase(client, currentID)
    const layoutContext = !databaseIsRootLevel
      ? layoutStrategy.newLevel(incomingContext, database)
      : incomingContext
    filesManager.set("base", "database", currentID, {
      path: layoutContext,
      lastEditedTime: database.metadata.last_edited_time,
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
        layoutContext,
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
      path: layoutStrategy.getPathForPage2(page, incomingContext),
      lastEditedTime: page.metadata.last_edited_time,
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
      const layoutContext = layoutStrategy.newLevel(incomingContext, page)
      // TODO: Consolidate these as generic object children, instead of using the `pageContentInfo`
      for (const page of pageContentInfo.childPageIdsAndOrder) {
        await getFileTreeMap(
          layoutContext,
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
          layoutContext,
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

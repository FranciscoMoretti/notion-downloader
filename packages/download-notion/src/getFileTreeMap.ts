import {
  Client,
  collectPaginatedAPI,
  isFullDatabase,
  isFullPage,
} from "@notionhq/client"

import { FilesMap } from "./FilesMap"
import { LayoutStrategy } from "./LayoutStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage, NotionPageConfig, getPageContentInfo } from "./NotionPage"

export async function getFileTreeMap(
  incomingContext: string,
  currentID: string,
  currentType: "page" | "database",
  databaseIsRootLevel: boolean,
  client: Client,
  layoutStrategy: LayoutStrategy,
  filesMap: FilesMap,
  pageConfig: NotionPageConfig
): Promise<void> {
  if (currentType === "database") {
    const database = await getNotionDatabase(client, currentID)
    const layoutContext = !databaseIsRootLevel
      ? layoutStrategy.newLevel(incomingContext, database)
      : incomingContext
    filesMap.database[currentID] = layoutContext

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
        filesMap,
        pageConfig
      )
    }
  } else if (currentType === "page") {
    const page = await getNotionPage(client, currentID, pageConfig)
    filesMap.page[currentID] = layoutStrategy.getPathForPage2(
      page,
      incomingContext
    )

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
          filesMap,
          pageConfig
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
          filesMap,
          pageConfig
        )
      }
    }
  } else {
    throw new Error(`Unknown type ${currentType}`)
  }
}
export async function getNotionPage(
  client: Client,
  currentID: string,
  pageConfig: NotionPageConfig
) {
  const pageResponse = await client.pages.retrieve({ page_id: currentID })
  if (!isFullPage(pageResponse)) {
    throw Error("Notion page response is not full for " + currentID)
  }
  const page = new NotionPage(pageResponse, pageConfig)
  return page
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

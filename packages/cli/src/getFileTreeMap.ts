import { Client } from "@notionhq/client"

import { FilesMap } from "./FilesMap"
import { LayoutStrategy } from "./LayoutStrategy"
import { NotionPageConfig, getPageContentInfo } from "./NotionPage2"
import { getNotionDatabase, getNotionPage2 } from "./notionPull"

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
    const databaseChildrenResponse = await client.databases.query({
      database_id: currentID,
    })
    for (const childObject of databaseChildrenResponse.results) {
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
    const page = await getNotionPage2(client, currentID, pageConfig)
    filesMap.page[currentID] = layoutStrategy.getPathForPage2(
      page,
      incomingContext
    )

    // Recurse to children
    const pageBlocksResponse = await client.blocks.children.list({
      block_id: currentID,
    })
    const pageInfo = await getPageContentInfo(pageBlocksResponse.results)
    // TODO: Also handle blocks that have block/page children (e.g. columns)
    if (pageInfo.childDatabaseIdsAndOrder || pageInfo.childPageIdsAndOrder) {
      const layoutContext = layoutStrategy.newLevel(incomingContext, page)
      // TODO: Consolidate these as generic object children, instead of using the `pageInfo`
      for (const page of pageInfo.childPageIdsAndOrder) {
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
      for (const database of pageInfo.childDatabaseIdsAndOrder) {
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

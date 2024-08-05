import { Client } from "@notionhq/client"

import { FilesMap } from "./FilesMap"
import { LayoutStrategy } from "./LayoutStrategy"
import { getPageContentInfo } from "./NotionPage2"
import { getNotionDatabase, getNotionPage2 } from "./pull"

export async function getFileTreeMap(
  incomingContext: string,
  currentID: string,
  currentType: "page" | "database",
  rootLevel: boolean,
  client: Client,
  layoutStrategy: LayoutStrategy,
  filesMap: FilesMap
): Promise<void> {
  if (currentType === "database") {
    const database = await getNotionDatabase(client, currentID)
    const layoutContext = layoutStrategy.newLevel(
      incomingContext,
      database.title
    )
    filesMap.database[currentID] = layoutContext

    // Recurse to children
    const databaseChildrenResponse = await client.databases.query({
      database_id: currentID,
    })
    for (const page of databaseChildrenResponse.results) {
      // TODO: Consider using just id from objectTreeMap instead of the database query here
      await getFileTreeMap(
        layoutContext,
        page.id,
        "page",
        false,
        client,
        layoutStrategy,
        filesMap
      )
    }
  } else if (currentType === "page") {
    const page = await getNotionPage2(client, currentID)
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
      const layoutContext = layoutStrategy.newLevel(
        incomingContext,
        page.nameOrTitle
      )
      for (const page of pageInfo.childPageIdsAndOrder) {
        await getFileTreeMap(
          layoutContext,
          page.id,
          "page",
          false,
          client,
          layoutStrategy,
          filesMap
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
          filesMap
        )
      }
    }
  } else {
    throw new Error(`Unknown type ${currentType}`)
  }
}

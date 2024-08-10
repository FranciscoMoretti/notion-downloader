import { Client } from "@notionhq/client"
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints"

import { FilesMap } from "./FilesMap"
import { LayoutStrategy } from "./LayoutStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage, getPageContentInfo, notionPageFromId } from "./NotionPage"
import { getBlockChildren } from "./getBlockChildren"
import { error, info, warning } from "./log"
import { OutputCounts } from "./notionPull"

// TODO: Add support for links
export async function getTreePages(
  outputRootPath: string,
  incomingContext: string,
  currentID: string,
  currentType: "page" | "database",
  rootLevel: boolean,
  client: Client,
  pages: Array<NotionPage>,
  layoutStrategy: LayoutStrategy,
  counts: OutputCounts,
  filesMap: FilesMap
) {
  info(
    `Looking for children and links from [${currentType}] ${incomingContext}/${currentID}...`
  )

  if (currentType == "database") {
    const databaseResponse = await client.databases.retrieve({
      database_id: currentID,
    })
    let layoutContext = incomingContext
    if (!rootLevel) {
      layoutContext = layoutStrategy.newLevel(
        incomingContext,
        // TODO: Improve how this property is handled
        new NotionDatabase(databaseResponse as DatabaseObjectResponse)
      )
    }

    // Save the DB filepath no matter if its the root label or not
    filesMap.database[currentID] = layoutContext

    const databaseChildrenResponse = await client.databases.query({
      database_id: currentID,
    })
    for (const page of databaseChildrenResponse.results) {
      await getTreePages(
        outputRootPath,
        layoutContext,
        page.id,
        "page",
        false,
        client,
        pages,
        layoutStrategy,
        counts,
        filesMap
      )
    }
  } else if (currentType == "page") {
    const currentPage = await notionPageFromId(currentID, client)
    const blocks = await getBlockChildren(currentPage.id, client)
    const pageInfo = await getPageContentInfo(blocks)

    // TODO: Consider dropping this restriction of not having content and children. An MD File can be at the same level as a folder
    if (
      !rootLevel &&
      pageInfo.hasParagraphs &&
      pageInfo.childPageIdsAndOrder.length
    ) {
      error(
        `Skipping "${currentPage.nameOrTitle}"  and its children. docu-notion does not support pages that are both levels and have text content (paragraphs) at the same time. Normally outline pages should just be composed of 1) links to other pages and 2) child pages (other levels of the outline). Note that @-mention style links appear as text paragraphs to docu-notion so must not be used to form the outline.`
      )
      ++counts.skipped_because_level_cannot_have_content
      return
    }
    if (!rootLevel && pageInfo.hasParagraphs) {
      filesMap.page[currentID] = incomingContext
      pages.push(currentPage)
    }

    // a normal outline page that exists just to create the level, pointing at database pages that belong in this level
    else if (
      pageInfo.childPageIdsAndOrder.length ||
      pageInfo.childDatabaseIdsAndOrder.length
    ) {
      let layoutContext = incomingContext
      if (!rootLevel) {
        layoutContext = layoutStrategy.newLevel(incomingContext, currentPage)
      }
      for (const childDatabaseInfo of pageInfo.childDatabaseIdsAndOrder) {
        await getTreePages(
          outputRootPath,
          layoutContext,
          childDatabaseInfo.id,
          "database",
          false,
          client,
          pages,
          layoutStrategy,
          counts,
          filesMap
        )
      }

      for (const childPageInfo of pageInfo.childPageIdsAndOrder) {
        await getTreePages(
          outputRootPath,
          layoutContext,
          childPageInfo.id,
          "page",
          false,
          client,
          pages,
          layoutStrategy,
          counts,
          filesMap
        )
      }
    } else {
      console.info(
        warning(
          `Warning: The page "${currentPage.nameOrTitle}" is in the outline but appears to not have content, links to other pages, or child pages. It will be skipped.`
        )
      )
      ++counts.skipped_because_empty
    }
  } else {
    error(`Unknown type ${currentType}`)
  }
}

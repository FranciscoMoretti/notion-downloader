import { Client } from "@notionhq/client"

import { LayoutStrategy } from "./LayoutStrategy"
import {
  NotionPageLegacy,
  fromPageIdLegacy,
  getPageContentInfoLegacy,
} from "./NotionPageLegacy"
import { getBlockChildren } from "./getBlockChildren"
import { error, info, warning } from "./log"
import { OutputCounts } from "./notionPull"

// This walks the "Outline" page and creates a list of all the nodes that will
// be in the sidebar, including the directories, the pages that are linked to
// that are parented in from the "Database", and any pages we find in the
// outline that contain content (which we call "Simple" pages). Later, we can
// then step through this list creating the files we need, and, crucially, be
// able to figure out what the url will be for any links between content pages.
export async function getOutlinePagesRecursively(
  outputRootPath: string,
  incomingContext: string,
  pageIdOfThisParent: string,
  orderOfThisParent: number,
  rootLevel: boolean,
  client: Client,
  pages: Array<NotionPageLegacy>,
  layoutStrategy: LayoutStrategy,
  counts: OutputCounts
) {
  const pageInTheOutline = await fromPageIdLegacy(
    incomingContext,
    pageIdOfThisParent,
    orderOfThisParent,
    true,
    client
  )

  info(
    `Looking for children and links from ${incomingContext}/${pageInTheOutline.nameOrTitle}`
  )

  const r = await getBlockChildren(pageInTheOutline.pageId, client)
  const pageInfo = await getPageContentInfoLegacy(r)

  if (
    !rootLevel &&
    pageInfo.hasParagraphs &&
    pageInfo.childPageIdsAndOrder.length
  ) {
    error(
      `Skipping "${pageInTheOutline.nameOrTitle}"  and its children. docu-notion does not support pages that are both levels and have text content (paragraphs) at the same time. Normally outline pages should just be composed of 1) links to other pages and 2) child pages (other levels of the outline). Note that @-mention style links appear as text paragraphs to docu-notion so must not be used to form the outline.`
    )
    ++counts.skipped_because_level_cannot_have_content
    return
  }
  if (!rootLevel && pageInfo.hasParagraphs) {
    pages.push(pageInTheOutline)

    // The best practice is to keep content pages in the "database" (e.g. kanban board), but we do allow people to make pages in the outline directly.
    // So how can we tell the difference between a page that is supposed to be content and one that is meant to form the sidebar? If it
    // has only links, then it's a page for forming the sidebar. If it has contents and no links, then it's a content page. But what if
    // it has both? Well then we assume it's a content page.
    if (pageInfo.linksPageIdsAndOrder?.length) {
      warning(
        `Note: The page "${pageInTheOutline.nameOrTitle}" is in the outline, has content, and also points at other pages. It will be treated as a simple content page. This is no problem, unless you intended to have all your content pages in the database (kanban workflow) section.`
      )
    }
  }

  // a normal outline page that exists just to create the level, pointing at database pages that belong in this level
  else if (
    pageInfo.linksPageIdsAndOrder.length ||
    pageInfo.childPageIdsAndOrder.length
  ) {
    let layoutContext = incomingContext
    // don't make a level for "Outline" page at the root
    if (!rootLevel && pageInTheOutline.nameOrTitle !== "Outline") {
      layoutContext = layoutStrategy.newLevel(
        incomingContext,
        pageInTheOutline.nameOrTitle
      )
    }
    for (const childPageInfo of pageInfo.childPageIdsAndOrder) {
      await getOutlinePagesRecursively(
        outputRootPath,
        layoutContext,
        childPageInfo.id,
        childPageInfo.order,
        false,
        client,
        pages,
        layoutStrategy,
        counts
      )
    }

    for (const linkPageInfo of pageInfo.linksPageIdsAndOrder) {
      pages.push(
        await fromPageIdLegacy(
          layoutContext,
          linkPageInfo.id,
          linkPageInfo.order,
          false,
          client
        )
      )
    }
  } else {
    console.info(
      warning(
        `Warning: The page "${pageInTheOutline.nameOrTitle}" is in the outline but appears to not have content, links to other pages, or child pages. It will be skipped.`
      )
    )
    ++counts.skipped_because_empty
  }
}

import * as Path from "path"
import { exit } from "process"
import { Client, isFullBlock } from "@notionhq/client"
import {
  BlockObjectResponse,
  ListBlockChildrenResponse,
} from "@notionhq/client/build/src/api-endpoints"
import fs from "fs-extra"
import { NotionCacheClient } from "notion-cache-client"
import { NotionObjectTreeNode, downloadObjectTree } from "notion-downloader"
import { NotionToMarkdown } from "notion-to-md"
import { ListBlockChildrenResponseResults } from "notion-to-md/build/types"

import { HierarchicalNamedLayoutStrategy } from "./HierarchicalNamedLayoutStrategy"
import { LayoutStrategy } from "./LayoutStrategy"
import { NotionPage, PageType, fromPageId } from "./NotionPage"
import { IDocuNotionConfig, loadConfigAsync } from "./config/configuration"
import { getOutlinePagesRecursively } from "./get-outline-pages-recursively"
import { getTreePages } from "./get-tree-pages"
import { cleanupOldImages, initImageHandling } from "./images"
import { endGroup, error, group, info, verbose } from "./log"
import { convertInternalUrl } from "./plugins/internalLinks"
import { IDocuNotionContext } from "./plugins/pluginTypes"
import { getMarkdownForPage } from "./transform"
import { NotionBlock } from "./types"
import { convertToUUID, saveDataToJson } from "./utils"

type ImageFileNameFormat = "default" | "content-hash" | "legacy"
export type DocuNotionOptions = {
  notionToken: string
  rootPage: string
  rootIsDb?: boolean
  locales: string[]
  cleanCache: Boolean
  markdownOutputPath: string
  imgOutputPath: string
  imgPrefixInMarkdown: string
  statusTag: string
  requireSlugs?: boolean
  imageFileNameFormat?: ImageFileNameFormat
}

let layoutStrategy: LayoutStrategy

export interface OutputCounts {
  output_normally: number
  skipped_because_empty: number
  skipped_because_status: number
  skipped_because_level_cannot_have_content: number
  error_because_no_slug: number
}

export const counts: OutputCounts = {
  output_normally: 0,
  skipped_because_empty: 0,
  skipped_because_status: 0,
  skipped_because_level_cannot_have_content: 0,
  error_because_no_slug: 0,
}

export async function notionPull(options: DocuNotionOptions): Promise<void> {
  // It's helpful when troubleshooting CI secrets and environment variables to see what options actually made it to docu-notion.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const optionsForLogging = { ...options }
  // Just show the first few letters of the notion token, which start with "secret" anyhow.
  optionsForLogging.notionToken =
    optionsForLogging.notionToken.substring(0, 10) + "..."

  // TODO: This should be moved up to the pull command that already loads configs
  const config = await loadConfigAsync()
  const rootPageUUID = convertToUUID(options.rootPage)

  verbose(`Options:${JSON.stringify(optionsForLogging, null, 2)}`)
  await initImageHandling(
    options.imgPrefixInMarkdown || options.imgOutputPath || "",
    options.imgOutputPath || "",
    options.locales
  )

  // TODO: HACK: until we can add the notion token to the config
  // options.statusTag = "Published"
  const CACHE_DIR = options.markdownOutputPath.replace(/\/+$/, "") + "/.cache/"

  const cachedNotionClient = new NotionCacheClient({
    auth: options.notionToken,
  })

  const notionToMarkdown = new NotionToMarkdown({
    notionClient: cachedNotionClient,
  })

  layoutStrategy = new HierarchicalNamedLayoutStrategy()

  await fs.mkdir(options.markdownOutputPath, { recursive: true })
  await fs.mkdir(options.markdownOutputPath.replace(/\/+$/, "") + "/.cache", {
    recursive: true,
  })

  layoutStrategy.setRootDirectoryForMarkdown(
    options.markdownOutputPath.replace(/\/+$/, "") // trim any trailing slash
  )

  info("Connecting to Notion...")

  // Do a  quick test to see if we can connect to the root so that we can give a better error than just a generic "could not find page" one.
  // TODO: Get root page, which can be DB or can be single page
  try {
    if (options.rootIsDb) {
      await cachedNotionClient.databases.retrieve({ database_id: rootPageUUID })
    } else {
      await cachedNotionClient.pages.retrieve({ page_id: rootPageUUID })
    }
  } catch (e: any) {
    error(
      `docu-notion could not retrieve the root page from Notion. \r\na) Check that the root page id really is "${rootPageUUID}".\r\nb) Check that your Notion API token (the "Integration Secret") is correct. It starts with "${
        optionsForLogging.notionToken
      }".\r\nc) Check that your root page includes your "integration" in its "connections".\r\nThis internal error message may help:\r\n    ${
        e.message as string
      }".\r\nd) Check that your root-is-db option is being used correctly. Current value is: ${
        options.rootIsDb
      }\r\n`
    )
    exit(1)
  }

  group(
    "Stage 1: walk children of the page named 'Outline', looking for pages..."
  )

  // Page tree that stores relationship between pages and their children. It can store children recursively in any depth.
  const objectsTree: NotionObjectTreeNode = await downloadObjectTree({
    client: cachedNotionClient,
    startingNode: {
      rootPageUUID: rootPageUUID,
      rootIsDb: options.rootIsDb || false,
    },
    dataOptions: {
      downloadAllPages: true,
      downloadDatabases: true,
      followLinks: true,
    },
    storageOptions: {
      cleanCache: options.cleanCache,
    },
  })

  info(`PULL: Fetched entire page tree`)

  const pages = new Array<NotionPage>()
  // ---- Markdown conversion and writing to files ----
  // // Demo of fetching with root database
  if (options.rootIsDb) {
    const response = await cachedNotionClient.databases.query({
      database_id: rootPageUUID,
    })
    const pagesPromises = response.results.map((page) => {
      const notionPage = fromPageId("", page.id, 0, true, cachedNotionClient)
      return notionPage
    })
    await Promise.all(pagesPromises).then((results) => {
      results.forEach((resultPage) => {
        console.log(resultPage)
        pages.push(resultPage)
      })
    })
  } else {
    await getTreePages(
      options.markdownOutputPath,
      "",
      rootPageUUID,
      options.rootIsDb ? "database" : "page",
      true,
      cachedNotionClient,
      pages,
      layoutStrategy,
      counts
    )
  }

  await saveDataToJson(objectsTree, CACHE_DIR + "object_tree.json")
  await saveDataToJson(pages, CACHE_DIR + "pages.json")

  info(`Found ${pages.length} pages`)
  endGroup()
  group(
    `Stage 2: convert ${pages.length} Notion pages to markdown and convertNotionLinkToLocalDocusaurusLink locally...`
  )
  await outputPages(
    options,
    config,
    pages,
    cachedNotionClient,
    layoutStrategy,
    notionToMarkdown
  )
  endGroup()
  group("Stage 3: clean up old files & images...")
  await layoutStrategy.cleanupOldFiles()
  await cleanupOldImages()
  endGroup()
}

async function outputPages(
  options: DocuNotionOptions,
  config: IDocuNotionConfig,
  pages: Array<NotionPage>,
  client: Client,
  layoutStrategy: LayoutStrategy,
  notionToMarkdown: NotionToMarkdown
) {
  const context: IDocuNotionContext = {
    getBlockChildren: (id: string) => getBlockChildren(id, client),
    // this changes with each page
    pageInfo: {
      directoryContainingMarkdown: "",
      relativeFilePathToFolderContainingPage: "",
      slug: "",
    },
    layoutStrategy: layoutStrategy,
    notionToMarkdown: notionToMarkdown,
    options: options,
    pages: pages,
    counts: counts, // review will this get copied or pointed to?
    imports: [],
    convertNotionLinkToLocalDocusaurusLink: (url: string) =>
      convertInternalUrl(context, url),
  }
  for (const page of pages) {
    layoutStrategy.pageWasSeen(page)
    const mdPath = layoutStrategy.getPathForPage(page, ".md")

    // most plugins should not write to disk, but those handling image files need these paths
    context.pageInfo.directoryContainingMarkdown = Path.dirname(mdPath)
    // TODO: This needs clarifying: getLinkPathForPage() is about urls, but
    // downstream images.ts is using it as a file system path
    context.pageInfo.relativeFilePathToFolderContainingPage = Path.dirname(
      layoutStrategy.getLinkPathForPage(page)
    )
    context.pageInfo.slug = page.slug

    if (
      page.type === PageType.DatabasePage &&
      context.options.statusTag != "*" &&
      page.status !== context.options.statusTag
    ) {
      verbose(
        `Skipping page because status is not '${context.options.statusTag}': ${page.nameOrTitle}`
      )
      ++context.counts.skipped_because_status
    } else {
      if (options.requireSlugs && !page.hasExplicitSlug) {
        error(
          `Page "${page.nameOrTitle}" is missing a required slug. (--require-slugs is set.)`
        )
        ++counts.error_because_no_slug
      }

      const markdown = await getMarkdownForPage(config, context, page)
      writePage(page, markdown)
    }
  }

  if (counts.error_because_no_slug > 0) exit(1)

  info(`Finished processing ${pages.length} pages`)
  info(JSON.stringify(counts))
}

function writePage(page: NotionPage, finalMarkdown: string) {
  const mdPath = layoutStrategy.getPathForPage(page, ".md")
  verbose(`writing ${mdPath}`)
  fs.writeFileSync(mdPath, finalMarkdown, {})
  ++counts.output_normally
}

export async function getBlockChildren(
  id: string,
  client: Client
): Promise<NotionBlock[]> {
  // we can only get so many responses per call, so we set this to
  // the first response we get, then keep adding to its array of blocks
  // with each subsequent response
  let overallResult: ListBlockChildrenResponse | undefined =
    await client.blocks.children.list({ block_id: id })

  const result = (overallResult?.results as BlockObjectResponse[]) ?? []
  // TODO - rethink if this numbering should be part of the downloading part of the app, or of the processing part
  numberChildrenIfNumberedList(result)
  return result
}
async function listBlockChildren(id: string, client: Client) {
  let overallResult: ListBlockChildrenResponse | undefined = undefined
  let start_cursor: string | undefined | null = undefined

  // Note: there is a now a collectPaginatedAPI() in the notion client, so
  // we could switch to using that (I don't know if it does rate limiting?)
  do {
    const response = await client.blocks.children.list({
      start_cursor: start_cursor as string | undefined,
      block_id: id,
    })

    if (!overallResult) {
      overallResult = response
    } else {
      overallResult.results.push(...response.results)
    }

    start_cursor = response?.next_cursor
  } while (start_cursor != null)
  // TODO: verify if this has_more property should be false after getting all
  overallResult.has_more = false

  if (overallResult?.results?.some((b) => !isFullBlock(b))) {
    error(
      `The Notion API returned some blocks that were not full blocks. Notion downloader does not handle this yet. Please report it.`
    )
    exit(1)
  }
  return overallResult
}

// This function is copied (and renamed from modifyNumberedListObject) from notion-to-md.
// They always run it on the results of their getBlockChildren.
// When we use our own getBlockChildren, we need to run it too.
export function numberChildrenIfNumberedList(
  blocks: ListBlockChildrenResponseResults
): void {
  let numberedListIndex = 0

  for (const block of blocks) {
    if ("type" in block && block.type === "numbered_list_item") {
      // add numbers
      // @ts-ignore
      block.numbered_list_item.number = ++numberedListIndex
    } else {
      numberedListIndex = 0
    }
  }
}

import * as Path from "path"
import { exit } from "process"
import {
  Client,
  isFullBlock,
  isFullDatabase,
  isFullPage,
} from "@notionhq/client"
import fs from "fs-extra"
import { NotionCacheClient } from "notion-cache-client"
import { NotionObjectTreeNode, downloadObjectTree } from "notion-downloader"
import { NotionToMarkdown } from "notion-to-md"
import { z } from "zod"

import { FileCleaner } from "./FileCleaner"
import { FilesMap } from "./FilesMap"
import { FlatLayoutStrategy } from "./FlatLayoutStrategy"
import { HierarchicalLayoutStrategy } from "./HierarchicalLayoutStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage, NotionPageConfig, notionPageFromId } from "./NotionPage"
import { IDocuNotionConfig, loadConfigAsync } from "./config/configuration"
import { pullOptionsSchema } from "./config/schema"
import { getBlockChildren } from "./getBlockChildren"
import { getFileTreeMap } from "./getFileTreeMap"
import { cleanupOldImages, initImageHandling } from "./images"
import { endGroup, error, group, info, verbose } from "./log"
import {
  GithubSlugNamingStrategy,
  GuidNamingStrategy,
  NotionSlugNamingStrategy,
  TitleNamingStrategy,
} from "./namingStrategy"
import { convertInternalUrl } from "./plugins/internalLinks"
import { IDocuNotionContext } from "./plugins/pluginTypes"
import { getMarkdownForPage } from "./transform"
import { convertToUUID, saveDataToJson } from "./utils"
import { configSchema } from "./utils/get-config"
import { writePage } from "./writePage"

export type DocuNotionOptions = z.infer<typeof pullOptionsSchema>

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

export async function getNotionPage2(
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

function sanitizeMarkdownOutputPath(path: string) {
  // Remove trailing slashes
  return path.replace(/\/+$/, "")
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
  const CACHE_DIR = options.markdownOutputPath.replace(/\/+$/, "") + "/.cache/"

  const cachedNotionClient = new NotionCacheClient({
    auth: options.notionToken,
  })

  const notionToMarkdown = new NotionToMarkdown({
    notionClient: cachedNotionClient,
  })

  const namingStrategy =
    options.namingStrategy === "github-slug"
      ? new GithubSlugNamingStrategy(options.slugProperty || "")
      : options.namingStrategy === "notion-slug"
      ? new NotionSlugNamingStrategy(options.slugProperty || "")
      : options.namingStrategy === "guid"
      ? new GuidNamingStrategy()
      : new TitleNamingStrategy()
  const layoutStrategy =
    options.layoutStrategy === "FlatGuidLayoutStrategy"
      ? new FlatLayoutStrategy(namingStrategy)
      : new HierarchicalLayoutStrategy(namingStrategy)

  const fileCleaner = new FileCleaner(options.markdownOutputPath)

  await fs.mkdir(options.markdownOutputPath, { recursive: true })
  await fs.mkdir(options.markdownOutputPath.replace(/\/+$/, "") + "/.cache", {
    recursive: true,
  })

  info("Connecting to Notion...")

  // Do a  quick test to see if we can connect to the root so that we can give a better error than just a generic "could not find page" one.
  // TODO: SHould move page type detection of root to a utility function. Here it retries 10 times before exiting if we use the cache client
  try {
    let pageResult = undefined
    if (!options.rootIsDb) {
      try {
        pageResult = await cachedNotionClient.pages.retrieve({
          page_id: rootPageUUID,
        })
      } catch (e: any) {
        // Catch APIResponseError
        if (e.code !== "object_not_found") {
          throw e
        }
      }
    }
    if (options.rootIsDb || !pageResult) {
      await cachedNotionClient.databases.retrieve({ database_id: rootPageUUID })
      options.rootIsDb = true
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

  const filesMap: FilesMap = {
    page: {},
    database: {},
    image: {},
  }

  const pageConfig: NotionPageConfig = {
    titleProperty: options.titleProperty,
    slugProperty: options.slugProperty,
  }

  await getFileTreeMap(
    "", // Start context
    rootPageUUID,
    options.rootIsDb ? "database" : "page",
    options.rootDbAsFolder,
    cachedNotionClient,
    layoutStrategy,
    filesMap,
    pageConfig
  )

  const pagesPromises: Promise<NotionPage>[] = Object.keys(filesMap.page).map(
    (id) => notionPageFromId(id, cachedNotionClient, pageConfig)
  )

  const pages = await Promise.all(pagesPromises)

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
    notionToMarkdown,
    filesMap
  )
  endGroup()
  group("Stage 3: clean up old files & images...")
  await fileCleaner.cleanupOldFiles(
    Object.values(filesMap.page).map(
      (p) => sanitizeMarkdownOutputPath(options.markdownOutputPath) + p
    )
  )
  await cleanupOldImages()
  endGroup()
}

async function outputPages(
  options: DocuNotionOptions,
  config: IDocuNotionConfig,
  pages: Array<NotionPage>,
  client: Client,
  notionToMarkdown: NotionToMarkdown,
  filesMap: FilesMap
) {
  const context: IDocuNotionContext = {
    getBlockChildren: (id: string) => getBlockChildren(id, client),
    // this changes with each page
    pageInfo: {
      directoryContainingMarkdown: "",
      relativeFilePathToFolderContainingPage: "",
      slug: "",
    },
    notionToMarkdown: notionToMarkdown,
    options: options,
    pages: pages,
    filesMap: filesMap,
    counts: counts, // review will this get copied or pointed to?
    imports: [],
    convertNotionLinkToLocalDocusaurusLink: (url: string) =>
      convertInternalUrl(context, url),
  }
  for (const page of pages) {
    // TODO: Marking as seen no longer needed, pagesTree can be compared with previous pageTree
    const mdPath = filesMap.page[page.id]
    const mdPathWithRoot =
      sanitizeMarkdownOutputPath(options.markdownOutputPath) + mdPath

    // most plugins should not write to disk, but those handling image files need these paths
    context.pageInfo.directoryContainingMarkdown = Path.dirname(mdPathWithRoot)
    context.pageInfo.relativeFilePathToFolderContainingPage = Path.basename(
      Path.dirname(mdPathWithRoot)
    )

    // Get the filename without extension
    context.pageInfo.slug = Path.basename(mdPathWithRoot, Path.extname(mdPath))

    if (
      page.isDatabasePage &&
      context.options.statusTag != "*" &&
      page.status !== context.options.statusTag
    ) {
      verbose(
        `Skipping page because status is not '${context.options.statusTag}': ${page.nameOrTitle}`
      )
      ++context.counts.skipped_because_status
      continue
    }

    const markdown = await getMarkdownForPage(config, context, page)
    writePage(markdown, mdPathWithRoot)
  }

  info(`Finished processing ${pages.length} pages`)
  info(JSON.stringify(counts))
}

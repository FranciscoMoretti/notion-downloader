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

import { FileCleaner } from "./FileCleaner"
import { FilesMap } from "./FilesMap"
import { FlatLayoutStrategy } from "./FlatLayoutStrategy"
import { HierarchicalLayoutStrategy } from "./HierarchicalLayoutStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage, NotionPageConfig, notionPageFromId } from "./NotionPage"
import { IDocuNotionConfig, loadConfigAsync } from "./config/configuration"
import { NotionPullOptions } from "./config/schema"
import { getBlockChildren } from "./getBlockChildren"
import { getFileTreeMap } from "./getFileTreeMap"
import {
  ImageHandler,
  cleanupOldImages,
  initImageHandling,
  processCoverImage,
} from "./images"
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

function sanitizeMarkdownOutputPath(path: string) {
  // Remove trailing slashes
  return path.replace(/\/+$/, "")
}

const CACHE_FOLDER = ".downloader"

export async function notionContinuosPull(options: NotionPullOptions) {
  // Wait forever
  while (true) {
    // Wait for the revalidation period after pulling
    await notionPull(options)
    if (options.revalidatePeriod < 0) {
      break
    }
    console.log("Waiting for " + options.revalidatePeriod + "s")
    await new Promise((resolve) =>
      setTimeout(resolve, options.revalidatePeriod * 1000)
    )
  }
}

export async function notionPull(options: NotionPullOptions): Promise<void> {
  // It's helpful when troubleshooting CI secrets and environment variables to see what options actually made it to docu-notion.

  const optionsForLogging = { ...options }
  // Just show the first few letters of the notion token, which start with "secret" anyhow.
  optionsForLogging.notionToken =
    optionsForLogging.notionToken.substring(0, 10) + "..."

  // TODO: This should be moved up to the pull command that already loads configs
  const pluginsConfig = await loadConfigAsync()
  const rootUUID = convertToUUID(options.rootId)

  info(`Options:${JSON.stringify(optionsForLogging, null, 2)}`)
  const imageHandler = await initImageHandling(
    options.imgPrefixInMarkdown || options.imgOutputPath || "",
    options.imgOutputPath || ""
  )

  // TODO: HACK: until we can add the notion token to the config
  const cacheDir = options.cwd.replace(/\/+$/, "") + `/${CACHE_FOLDER}/`

  const cachedNotionClient = new NotionCacheClient({
    auth: options.notionToken,
    cacheOptions: {
      cacheDirectory: cacheDir,
    },
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
  await fs.mkdir(cacheDir, { recursive: true })

  info("Connecting to Notion...")

  // Do a  quick test to see if we can connect to the root so that we can give a better error than just a generic "could not find page" one.
  const rootObjectType = await getRootObjectType({
    cachedNotionClient,
    rootUUID,
    rootObjectType: options.rootObjectType,
  })

  group("Stage 1: walk children of the root page, looking for pages...")

  // Load last edited time of pages from cache
  let pagesLastEditedTime = null
  if (options.cache?.cacheStrategy !== "no-cache") {
    // TODO: There is duplication because this is done both here and in downloadObjectTree
    await cachedNotionClient.cache.loadCache()
    pagesLastEditedTime = Object.fromEntries(
      Object.values(cachedNotionClient.cache.pageObjectsCache).map((page) => [
        page.data.id,
        page.data.last_edited_time,
      ])
    )
  }

  // Page tree that stores relationship between pages and their children. It can store children recursively in any depth.
  const objectsTree: NotionObjectTreeNode = await downloadObjectTree({
    client: cachedNotionClient,
    startingNode: {
      rootUUID: rootUUID,
      rootObjectType: rootObjectType,
    },
    dataOptions: {
      downloadAllPages: true,
      downloadDatabases: true,
      followLinks: true,
    },
    cachingOptions: options.cache,
  })

  await saveDataToJson(objectsTree, cacheDir + "object_tree.json")
  info("PULL: Notion Download Completed")
  if (options.skipConversion) {
    return
  }

  // TODO: Support images file map
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
    rootUUID,
    rootObjectType,
    options.rootDbAsFolder,
    cachedNotionClient,
    layoutStrategy,
    filesMap,
    pageConfig
  )

  const pagesPromises: Promise<NotionPage>[] = Object.keys(filesMap.page).map(
    (id) => notionPageFromId(id, cachedNotionClient, pageConfig)
  )

  const allPages = await Promise.all(pagesPromises)

  // ----- Page filtering ----
  function shouldSkipPageFilter(page: NotionPage): boolean {
    return (
      options.statusTag !== "*" &&
      page.status !== options.statusTag &&
      page.status !== ""
    )
  }
  // Filter pages that have an incorrect status
  const pages = allPages.filter((page) => {
    const shouldSkip = shouldSkipPageFilter(page)
    if (shouldSkip) {
      verbose(
        `Skipping ${page.nameOrTitle} because it has status ${page.status}`
      )
      ++counts.skipped_because_status
    }
    return !shouldSkip
  })

  // Filter from filesMap
  Object.keys(filesMap.page).forEach((id) => {
    const page = pages.find((p) => p.id === id)
    if (!page) {
      delete filesMap.page[id]
    }
  })

  // Only output pages that changed! The rest already exist.
  const pagesToOutput = pages.filter((page) => {
    return pagesLastEditedTime
      ? page.metadata.last_edited_time !== pagesLastEditedTime[page.id]
      : true
  })

  await saveDataToJson(
    filesMap,
    sanitizeMarkdownOutputPath(options.markdownOutputPath) + "/files_map.json"
  )

  info(`Found ${allPages.length} pages`)
  info(`Found ${pagesToOutput.length} new pages`)
  endGroup()
  group(
    `Stage 2: convert ${pagesToOutput.length} Notion pages to markdown and convertNotionLinkToLocalDocusaurusLink locally...`
  )

  await outputPages(
    options,
    pluginsConfig,
    pagesToOutput,
    cachedNotionClient,
    notionToMarkdown,
    filesMap,
    imageHandler
  )
  endGroup()
  group("Stage 3: clean up old files & images...")
  await fileCleaner.cleanupOldFiles(
    Object.values(filesMap.page).map(
      (p) => sanitizeMarkdownOutputPath(options.markdownOutputPath) + p
    )
  )
  await cleanupOldImages(imageHandler)
  endGroup()
}

async function tryGetFirstPageWithType({
  cachedNotionClient,
  rootObjectType,
  rootUUID,
}: {
  cachedNotionClient: NotionCacheClient
  rootObjectType: "page" | "database" | "auto"
  rootUUID: string
}): Promise<"page" | "database"> {
  // TODO: Here it retries 10 times before exiting if we use the cache client
  try {
    let pageResult = undefined
    if (["auto", "page"].includes(rootObjectType)) {
      try {
        pageResult = await cachedNotionClient.pages.retrieve({
          page_id: rootUUID,
        })
        return Promise.resolve("page")
      } catch (e: any) {
        // Catch APIResponseError
        if (e.code !== "object_not_found") {
          throw e
        }
      }
    }
    if (["auto", "database"].includes(rootObjectType) || !pageResult) {
      await cachedNotionClient.databases.retrieve({ database_id: rootUUID })
      return Promise.resolve("database")
    }
  } catch (e: any) {
    Promise.reject(e)
  }
  return Promise.reject("Error found: Unexpected code path")
}

async function outputPages(
  options: NotionPullOptions,
  config: IDocuNotionConfig,
  pages: Array<NotionPage>,
  client: Client,
  notionToMarkdown: NotionToMarkdown,
  filesMap: FilesMap,
  imageHandler: ImageHandler
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
    imageHandler: imageHandler,
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

    await processCoverImage(page, context)

    const markdown = await getMarkdownForPage(config, context, page)
    writePage(markdown, mdPathWithRoot)
  }

  info(`Finished processing ${pages.length} pages`)
  info(JSON.stringify(counts))
}
async function getRootObjectType(
  params: Parameters<typeof tryGetFirstPageWithType>[0]
) {
  return tryGetFirstPageWithType(params).catch((e) => {
    error(
      `notion downloader could not retrieve the root page from Notion. \r\na) Check that the root page id really is "${
        params.rootUUID
      }".\r\nb) Check that your Notion API token (the "Integration Secret") is correct.
      .\r\nc) Check that your root page includes your "integration" in its "connections".\r\nThis internal error message may help:\r\n    ${
        e.message as string
      }".\r\nd) Check that your root-is-db option is being used correctly. Current value is: ${
        params.rootObjectType
      }\r\n`
    )
    exit(1)
  })
}

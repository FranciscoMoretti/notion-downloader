import path from "path"
import { exit } from "process"
import { Client } from "@notionhq/client"
import fs from "fs-extra"
import { NotionCacheClient } from "notion-cache-client"
import { NotionObjectTreeNode, downloadObjectTree } from "notion-downloader"
import { NotionToMarkdown } from "notion-to-md"

import { FilesManager } from "./FilesManager"
import { FilesMap, ObjectsDirectories } from "./FilesMap"
import { FlatLayoutStrategy } from "./FlatLayoutStrategy"
import { HierarchicalLayoutStrategy } from "./HierarchicalLayoutStrategy"
import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionDatabase } from "./NotionDatabase"
import {
  DatabaseObjectResponseWithCover,
  NotionImage,
  PageObjectResponseWithCover,
} from "./NotionImage"
import { NotionPage, NotionPageConfig, notionPageFromId } from "./NotionPage"
import { PathStrategy } from "./PathStrategy"
import { IDocuNotionConfig, loadConfigAsync } from "./config/configuration"
import { NotionPullOptions } from "./config/schema"
import { getBlockChildren } from "./getBlockChildren"
import { getFileTreeMap } from "./getFileTreeMap"
import { getStrategy } from "./getOutputImageFileName"
import { updateImageUrlToMarkdownImagePath } from "./images"
import { endGroup, error, group, info, verbose } from "./log"
import {
  GithubSlugNamingStrategy,
  GuidNamingStrategy,
  NotionSlugNamingStrategy,
  TitleNamingStrategy,
} from "./namingStrategies"
import {
  getAllObjectsInObjectsTree,
  objectsToObjectsMap,
} from "./objects_utils"
import { removePathPrefix } from "./pathUtils"
import { convertInternalUrl } from "./plugins/internalLinks"
import { IDocuNotionContext } from "./plugins/pluginTypes"
import { getMarkdownForPage } from "./transform"
import {
  convertToUUID,
  getAncestorPageOrDatabaseFilename,
  sanitizeMarkdownOutputPath,
  saveDataToJson,
} from "./utils"
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

const CACHE_FOLDER = ".downloader"
const FILES_MAP_FILE_PATH = "files_map.json"

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

function loadFilesMapFile(filePath: string): FilesMap | undefined {
  if (fs.existsSync(filePath)) {
    const jsonData = fs.readFileSync(filePath, "utf8")
    return FilesMap.fromJson(jsonData)
  }
  return undefined
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

  const objectsDirectories: ObjectsDirectories = {
    page: options.markdownOutputPath,
    database: options.markdownOutputPath,
    image: options.imgOutputPath,
  }

  const filesMapFilePath =
    options.cwd.replace(/\/+$/, "") + "/" + FILES_MAP_FILE_PATH
  const initialFilesMap = loadFilesMapFile(filesMapFilePath)
  const filesManager = new FilesManager(initialFilesMap, objectsDirectories)

  const imageMarkdownPathStrategy = new PathStrategy({
    pathPrefix: options.imgPrefixInMarkdown || options.imgOutputPath || ".",
  })
  const imageFilePathStrategy = new PathStrategy({
    pathPrefix: options.imgOutputPath,
  })
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

  const filesMap = new FilesMap()

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

  const objects = await getAllObjectsInObjectsTree(
    objectsTree,
    cachedNotionClient
  )
  const allObjectsMap = objectsToObjectsMap(objects)

  const imageBlocks = Object.values(objects.block).filter(
    (block) => block.type === "image"
  )
  const imageNamingStrategy: ImageNamingStrategy = getStrategy(
    "default",
    (image) => getAncestorPageOrDatabaseFilename(image, allObjectsMap, filesMap)
  )

  const allPages = Object.values(objects.page).map(
    (page) => new NotionPage(page, pageConfig)
  )
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

  // Get Image path for each image block in filesMap.image
  for (const block of imageBlocks) {
    const image = new NotionImage(block)
    if (filesManager.shouldProcessObject(image)) {
      await image.read()
      const imageFilename = imageNamingStrategy.getFileName(image)

      // TODO: Include layout strategy to get a potential layout from filename before adding prefix
      const imageFileOutputPath = imageFilePathStrategy.getPath(imageFilename)

      // TODO: All saves could be done in parallel
      await image.save(imageFileOutputPath)

      const pathFromImageDirectory = removePathPrefix(
        imageFileOutputPath,
        options.imgOutputPath
      )
      filesMap.set("image", image.id, {
        path: pathFromImageDirectory,
        lastEditedTime: image.lastEditedTime,
      })
      const filePathToUseInMarkdown =
        imageMarkdownPathStrategy.getPath(imageFilename)
      // Set the updated path
      updateImageUrlToMarkdownImagePath(block.image, filePathToUseInMarkdown)
    } else {
      // Save in new filesmap without changes
      const imageRecordFromRoot = filesManager.get(
        "directory",
        "image",
        image.id
      )
      filesMap.set("image", image.id, imageRecordFromRoot)
      // Update markdown in case pages link to this image
      const filePathToUseInMarkdown = imageRecordFromRoot.path
      updateImageUrlToMarkdownImagePath(block.image, filePathToUseInMarkdown)
    }
  }

  // Processing of cover images of pages
  for (const page of pages) {
    // ------ Replacement of cover image
    const pageResponse = page.metadata
    const cover = pageResponse.cover
    if (!cover) {
      continue
    }
    const shouldWritePage = filesManager.shouldProcessObject(page)
    if (shouldWritePage) {
      const image = new NotionImage(pageResponse as PageObjectResponseWithCover)
      await image.read()

      const imageFilename = imageNamingStrategy.getFileName(image)

      const imageFileOutputPath = imageFilePathStrategy.getPath(imageFilename)
      const filePathToUseInMarkdown =
        imageMarkdownPathStrategy.getPath(imageFilename)

      // TODO: All saves could be done in parallel
      await image.save(imageFileOutputPath)
      const pathFromImageDirectory = removePathPrefix(
        imageFileOutputPath,
        options.imgOutputPath
      )
      filesMap.set("image", image.id, {
        path: pathFromImageDirectory,
        lastEditedTime: image.lastEditedTime,
      })
      updateImageUrlToMarkdownImagePath(cover, filePathToUseInMarkdown)
    } else {
      const imageRecordFromRoot = filesManager.get(
        "directory",
        "image",
        page.id
      )
      filesMap.set("image", page.id, imageRecordFromRoot)
      // Update markdown in case pages link to this image
      const filePathToUseInMarkdown = imageRecordFromRoot.path
      updateImageUrlToMarkdownImagePath(cover, filePathToUseInMarkdown)
    }
  }

  // Processing of cover images of databases
  const databases: NotionDatabase[] = Object.values(objects.database).map(
    (db) => new NotionDatabase(db)
  )
  for (const database of databases) {
    // ------ Replacement of cover image
    const databaseResponse = database.metadata
    const cover = databaseResponse.cover
    if (!cover) {
      continue
    }

    const shouldWriteDatabase = filesManager.shouldProcessObject(database)
    // TODO: Write/keep logic should go first. Cover writing `if` should go inside. Should save to filemap if exists
    if (shouldWriteDatabase) {
      const image = new NotionImage(
        databaseResponse as DatabaseObjectResponseWithCover
      )
      await image.read()

      const imageFilename = imageNamingStrategy.getFileName(image)

      const imageFileOutputPath = imageFilePathStrategy.getPath(imageFilename)
      const filePathToUseInMarkdown =
        imageMarkdownPathStrategy.getPath(imageFilename)

      // TODO: All saves could be done in parallel
      await image.save(imageFileOutputPath)
      // TODO: This should be handled by FilesManager
      const pathFromImageDirectory = removePathPrefix(
        imageFileOutputPath,
        options.imgOutputPath
      )
      filesMap.set("image", image.id, {
        path: pathFromImageDirectory,
        lastEditedTime: image.lastEditedTime,
      })
      updateImageUrlToMarkdownImagePath(cover, filePathToUseInMarkdown)
    } else {
      const imageRecordFromRoot = filesManager.get(
        "directory",
        "image",
        database.id
      )
      filesMap.set("image", database.id, imageRecordFromRoot)
      // Update markdown in case pages link to this image
      const filePathToUseInMarkdown = imageRecordFromRoot.path
      updateImageUrlToMarkdownImagePath(cover, filePathToUseInMarkdown)
    }
  }

  // Filter from filesMap
  Object.keys(filesMap.getAllOfType("page")).forEach((id) => {
    const page = pages.find((p) => p.id === id)
    if (!page) {
      filesMap.delete("page", id)
    }
  })

  // Only output pages that changed! The rest already exist.
  const pagesToOutput = pages.filter((page) => {
    return filesManager.shouldProcessObject(page)
  })

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
    filesMap
  )
  endGroup()
  group("Stage 3: clean up old files & images...")
  const fromRootFilesMap = filesMap.allToRootRelativePath(
    filesMap,
    objectsDirectories
  )

  await filesManager.cleanOldFiles(fromRootFilesMap)
  await saveDataToJson(fromRootFilesMap.getAll(), filesMapFilePath)
  // TODO: Ceanup images based on filesMap
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
  filesMap: FilesMap
) {
  const context: IDocuNotionContext = {
    getBlockChildren: (id: string) => getBlockChildren(id, client),
    // this changes with each page
    pageInfo: {
      directoryContainingMarkdown: "",
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
    const mdPath = filesMap.get("page", page.id)?.path
    const mdPathWithRoot =
      sanitizeMarkdownOutputPath(options.markdownOutputPath) + mdPath
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

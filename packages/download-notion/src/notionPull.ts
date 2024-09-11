import path from "path"
import { exit } from "process"
import { Client } from "@notionhq/client"
import fs from "fs-extra"
import { NotionCacheClient, convertToUUID } from "notion-cache-client"
import { NotionObjectTree, downloadObjectTree } from "notion-downloader"
import { NotionToMarkdown } from "notion-to-md"

import { IDocuNotionConfig, loadConfigAsync } from "./config/configuration"
import { NotionPullOptions } from "./config/schema"
import { createStrategies } from "./createStrategies"
import { fetchAssets } from "./fetchAssets"
import { FilesCleaner, cleanup } from "./files/FilesCleaner"
import { FilesManager, ObjectPrefixDict } from "./files/FilesManager"
import { FileRecordType, FilesMap } from "./files/FilesMap"
import {
  loadassetsCacheFilesMap as loadAssetsCacheFilesMap,
  loadFilesManagerFile,
  saveDataToFile,
  saveObjectToJson,
} from "./files/saveLoadUtils"
import { getBlockChildren } from "./getBlockChildren"
import { getFileTreeMap } from "./getFileTreeMap"
import { endGroup, error, group, info } from "./log"
import { NotionPage } from "./notionObjects/NotionPage"
import { filterTree } from "./objectTree/filterTree"
import { getAllObjectsInObjectsTree } from "./objectTree/objectTreeUtills"
import { convertInternalUrl } from "./plugins/internalLinks"
import { IDocuNotionContext } from "./plugins/pluginTypes"
import {
  readOrDownloadNewImages,
  saveNewAssets,
  updateImageFilePathsForMarkdown,
} from "./processImages"
import { getMarkdownForPage } from "./transformMarkdown"
import { FileBuffersMemory } from "./types"
import { sanitizeMarkdownOutputPath } from "./utils"
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

function getCacheDirectories(options: NotionPullOptions) {
  const cacheDir = getCachePath(options)
  return {
    cacheDir,
    assetsCacheDir: cacheDir,
    objectTreeCachePath: cacheDir + "object_tree.json",
    filesMapCachePath: cacheDir + "output_filesmap.json",
    assetsCacheFilesMapPath: cacheDir + "assets_cache_filesmap.json",
  }
}

export async function notionPull(options: NotionPullOptions): Promise<void> {
  // It's helpful when troubleshooting CI secrets and environment variables to see what options actually made it to docu-notion.
  const optionsForLogging = getOptionsForLogging(options)
  info(`Options:${JSON.stringify(optionsForLogging, null, 2)}`)
  // TODO: This should be moved up to the pull command that already loads configs
  const rootUUID = convertToUUID(options.rootId)

  const {
    cacheDir,
    assetsCacheDir,
    objectTreeCachePath,
    filesMapCachePath,
    assetsCacheFilesMapPath,
  } = getCacheDirectories(options)
  const cachedNotionClient = createCachedNotionClient(
    options.notionToken,
    cacheDir
  )

  const { objectsDirectories, markdownPrefixes } =
    createDirectoriesAndPrefixes(options)

  const { existingFilesManager, newFilesManager } = await setupFilesManagers(
    options,
    objectsDirectories,
    markdownPrefixes,
    cachedNotionClient,
    filesMapCachePath
  )

  // TODO: Consider if this is necesary. All the paths seem to create their own directories.
  await createDirectories(options, cacheDir)

  info("Testing connection to Notion...")
  // Do a quick test to see if we can connect to the root so that we can give a better error than just a generic "could not find page" one.
  const rootObjectType = await getRootObjectType({
    cachedNotionClient,
    rootUUID,
    rootObjectType: options.rootObjectType,
  })

  group("Stage 1: walk children of the root page, looking for pages...")
  const objectsTree = await downloadAndProcessObjectTree(
    cachedNotionClient,
    rootUUID,
    rootObjectType,
    options,
    objectTreeCachePath
  )

  const assetsCacheFilesMap = await cacheNewAssets(
    options,
    assetsCacheDir,
    assetsCacheFilesMapPath,
    objectsTree
  )

  info("PULL: Notion Download Completed")
  if (options.conversion.skip) {
    info("Skipping conversion phases")
    return
  }

  endGroup()
  group("Stage 2: Filtering pages...")
  filterTree(
    objectsTree,
    options.conversion.statusPropertyName,
    options.conversion.statusPropertyValue
  )
  endGroup()

  group("Stage 3: Reading new assets...")
  const filesInMemory: FileBuffersMemory = {}
  await readOrDownloadNewImages(
    objectsTree,
    assetsCacheFilesMap,
    existingFilesManager,
    filesInMemory
  )
  endGroup()

  group("Stage 4: Building paths...")
  // 4. Path building
  const { markdownLayoutStrategy, imageLayoutStrategy } = createStrategies(
    options,
    objectsTree,
    newFilesManager
  )

  getFileTreeMap(
    "",
    objectsTree,
    options.rootDbAsFolder,
    markdownLayoutStrategy,
    imageLayoutStrategy,
    existingFilesManager,
    newFilesManager,
    filesInMemory
  )

  await updateImageFilePathsForMarkdown(objectsTree, newFilesManager)

  endGroup()

  group("Stage 4: Saving new assets...")

  await saveNewAssets(
    objectsTree,
    existingFilesManager,
    newFilesManager,
    filesInMemory
  )

  // 5. Save assets

  endGroup()

  // Only output pages that changed! The rest already exist.
  const pagesToOutput = getPagesToOutput(objectsTree, existingFilesManager)
  info(`Found ${objectsTree.getPages().length} pages`)
  info(`Found ${pagesToOutput.length} new pages`)

  group(`Stage 5: convert ${pagesToOutput.length} Notion pages to markdown...`)
  const pluginsConfig = await loadConfigAsync()
  const notionToMarkdown = new NotionToMarkdown({
    notionClient: cachedNotionClient,
  })
  await outputPages(
    options,
    pluginsConfig,
    pagesToOutput,
    cachedNotionClient,
    notionToMarkdown,
    newFilesManager
  )
  endGroup()

  group("Stage 6: clean up old files & images...")
  await cleanup(existingFilesManager, newFilesManager)

  await saveDataToFile(newFilesManager.toJSON(), filesMapCachePath)
  endGroup()
}

function getOptionsForLogging(options: NotionPullOptions) {
  const optionsForLogging = { ...options }
  optionsForLogging.notionToken =
    optionsForLogging.notionToken.substring(0, 10) + "..."
  return optionsForLogging
}

function getCachePath(options: NotionPullOptions): string {
  const CACHE_FOLDER = ".downloader"
  return options.cwd.replace(/\/+$/, "") + `/${CACHE_FOLDER}/`
}

function createCachedNotionClient(
  notionToken: string,
  cacheDir: string
): NotionCacheClient {
  return new NotionCacheClient({
    auth: notionToken,
    cacheOptions: { cacheDirectory: cacheDir },
  })
}

function createDirectoriesAndPrefixes(options: NotionPullOptions) {
  // TODO: Simplify this logic
  const objectsDirectories: ObjectPrefixDict = {
    page: options.conversion.outputPaths.markdown,
    database: options.conversion.outputPaths.markdown,
    image: options.conversion.outputPaths.images,
    file: options.conversion.outputPaths.files,
    video: options.conversion.outputPaths.videos,
    pdf: options.conversion.outputPaths.pdfs,
    audio: options.conversion.outputPaths.audios,
  }

  const markdownPrefixes: ObjectPrefixDict = {
    page: "",
    database: "",
    image:
      options.conversion.markdownPrefixes.images ||
      options.conversion.outputPaths.images ||
      ".",
    file:
      options.conversion.markdownPrefixes.files ||
      options.conversion.outputPaths.files ||
      ".",
    video:
      options.conversion.markdownPrefixes.videos ||
      options.conversion.outputPaths.videos ||
      ".",
    pdf:
      options.conversion.markdownPrefixes.pdfs ||
      options.conversion.outputPaths.pdfs ||
      ".",
    audio:
      options.conversion.markdownPrefixes.audios ||
      options.conversion.outputPaths.audios ||
      ".",
  }

  return { objectsDirectories, markdownPrefixes }
}

async function setupFilesManagers(
  options: NotionPullOptions,
  objectsDirectories: ObjectPrefixDict,
  markdownPrefixes: ObjectPrefixDict,
  cachedNotionClient: NotionCacheClient,
  filesMapCachePath: string
) {
  const previousFilesManager = loadFilesManagerFile(filesMapCachePath)

  if (previousFilesManager) {
    // TODO Create a directories change function
    const prevDirs = previousFilesManager.getOutputDirectories()
    const currentDirs = objectsDirectories

    const keys = Object.keys(prevDirs) as FileRecordType[]
    const dirsChanged = keys.some((key) => prevDirs[key] !== currentDirs[key])
    if (dirsChanged) {
      info("Output directories changed. Deleting all tracked files.")
      const filesCleaner = new FilesCleaner()
      await filesCleaner.cleanupAllFiles(previousFilesManager)
      previousFilesManager.reset()
      info("Output directories changed. Clearing the cache.")
      // Reset the cache since assets URLs could have changed (cover images, block images)
      // TODO: Consider moving the image/asset files instead of removing them and clearing the cache
      if (!options.cache.cacheAssets) {
        cachedNotionClient.cache.clearCache()
      }
    }
  }

  const existingFilesManager =
    previousFilesManager ||
    new FilesManager({
      outputDirectories: objectsDirectories,
      markdownPrefixes,
    })
  const newFilesManager = new FilesManager({
    outputDirectories: objectsDirectories,
    markdownPrefixes,
  })

  return { existingFilesManager, newFilesManager }
}

async function createDirectories(options: NotionPullOptions, cacheDir: string) {
  await fs.mkdir(options.conversion.outputPaths.markdown, { recursive: true })
  await fs.mkdir(cacheDir, { recursive: true })
}

async function downloadAndProcessObjectTree(
  cachedNotionClient: NotionCacheClient,
  rootUUID: string,
  rootObjectType: "page" | "database",
  options: NotionPullOptions,
  objectTreeCachePath: string
) {
  // Page tree that stores relationship between pages and their children. It can store children recursively in any depth.
  const objectsTreeRootNode = await downloadObjectTree({
    client: cachedNotionClient,
    startingNode: { rootUUID, rootObjectType },
    dataOptions: {
      // TODO: Consider exposing this as options or making it a default input arg
      downloadAllPages: true,
      downloadDatabases: true,
      followLinks: true,
    },
    cachingOptions: options.cache,
  })

  await saveObjectToJson(objectsTreeRootNode, objectTreeCachePath)

  const objectsData = await getAllObjectsInObjectsTree(
    objectsTreeRootNode,
    cachedNotionClient
  )
  return new NotionObjectTree(objectsTreeRootNode, objectsData)
}

async function cacheNewAssets(
  options: NotionPullOptions,
  assetsCacheDir: string,
  assetsCacheFilesMapPath: string,
  objectsTree: NotionObjectTree
) {
  if (!options.cache.cacheAssets) return undefined

  const assetsCacheFilesMap =
    loadAssetsCacheFilesMap(assetsCacheFilesMapPath) || new FilesMap()

  await fetchAssets(objectsTree, ["image"], assetsCacheDir, assetsCacheFilesMap)
  await saveDataToFile(assetsCacheFilesMap.toJSON(), assetsCacheFilesMapPath)

  return assetsCacheFilesMap
}

function getPagesToOutput(
  objectsTree: NotionObjectTree,
  existingFilesManager: FilesManager
) {
  const pages = objectsTree.getPages().map((page) => new NotionPage(page))
  return pages.filter((page) => existingFilesManager.isObjectNew(page))
}

async function outputPages(
  options: NotionPullOptions,
  config: IDocuNotionConfig,
  pages: Array<NotionPage>,
  client: Client,
  notionToMarkdown: NotionToMarkdown,
  filesManager: FilesManager
) {
  const context: IDocuNotionContext = createContext(
    options,
    pages,
    client,
    notionToMarkdown,
    filesManager
  )

  for (const page of pages) {
    const mdPath = filesManager.get("base", "page", page.id)?.path
    const mdPathWithRoot =
      sanitizeMarkdownOutputPath(options.conversion.outputPaths.markdown) +
      mdPath
    const markdown = await getMarkdownForPage(config, context, page)
    writePage(markdown, mdPathWithRoot)
  }

  info(`Finished processing ${pages.length} pages`)
  info(JSON.stringify(counts))
}

function createContext(
  options: NotionPullOptions,
  pages: Array<NotionPage>,
  client: Client,
  notionToMarkdown: NotionToMarkdown,
  filesManager: FilesManager
): IDocuNotionContext {
  const context = {
    getBlockChildren: (id: string) => getBlockChildren(id, client),
    // this changes with each page
    pageInfo: {
      directoryContainingMarkdown: "",
      slug: "",
    },
    notionToMarkdown: notionToMarkdown,
    options: options,
    pages: pages,
    filesManager: filesManager,
    counts: counts, // review will this get copied or pointed to?
    imports: [],
    convertNotionLinkToLocalDocusaurusLink: (url: string) =>
      convertInternalUrl(context, url),
  }
  return context
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

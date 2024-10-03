import { debug } from "console"
import path from "path"
import { performance } from "perf_hooks"
import { exit } from "process"
import { Client } from "@notionhq/client"
import fs from "fs-extra"
import {
  NotionCacheClient,
  ObjectType,
  PageOrDatabase,
  convertToUUID,
} from "notion-cache-client"
import { NotionObjectTree, downloadNotionObjectTree } from "notion-downloader"
import { NotionToMarkdown } from "notion-to-md"

import { IPluginsConfig, loadConfigAsync } from "./config/configuration"
import {
  FilepathGroup,
  NotionPullOptions,
  parsePathFileOptions,
} from "./config/schema"
import { createStrategies } from "./createStrategies"
import { preFetchAssets } from "./fetchAssets"
import { FilesCleaner, cleanupOldsFiles } from "./files/FilesCleaner"
import { FilesManager } from "./files/FilesManager"
import { FileRecordType, FilesMap } from "./files/FilesMap"
import {
  loadassetsCacheFilesMap as loadAssetsCacheFilesMap,
  loadFilesManagerFile,
  loadJsonToObject,
  saveDataToFile,
  saveObjectToJson,
} from "./files/saveLoadUtils"
import { getBlockChildren } from "./getBlockChildren"
import { getFileTreeMap } from "./getFileTreeMap"
import { endGroup, error, group, info } from "./log"
import { NotionPage } from "./notionObjects/NotionPage"
import { filterTree } from "./objectTree/filterTree"
import { convertInternalUrl } from "./plugins/internalLinks"
import { IPluginContext } from "./plugins/pluginTypes"
import {
  readOrDownloadNewAssets,
  saveNewAssets,
  updateAssetFilePathsForMarkdown,
} from "./processAssets"
import { getMarkdownForPage } from "./transformMarkdown"
import { FileBuffersMemory } from "./types"
import { handleError } from "./utils_old/handle-error"
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
    lastOptionsCachePath: cacheDir + "last_config.json",
  }
}

function haveOptionsChanged(
  prevOptions: NotionPullOptions,
  options: NotionPullOptions
) {
  // Deep compare all options except for the notionToken
  const prevOptionsWithoutToken = { ...prevOptions, notionToken: undefined }
  const optionsWithoutToken = { ...options, notionToken: undefined }
  return (
    JSON.stringify(prevOptionsWithoutToken) !==
    JSON.stringify(optionsWithoutToken)
  )
}

export async function notionPull(options: NotionPullOptions): Promise<void> {
  const startTime = performance.now()
  const stageTimes: Record<string, number> = {}

  const optionsForLogging = getOptionsForLogging(options)
  info(`Options:${JSON.stringify(optionsForLogging, null, 2)}`)

  const {
    cacheDir,
    assetsCacheDir,
    objectTreeCachePath,
    filesMapCachePath,
    assetsCacheFilesMapPath,
    lastOptionsCachePath,
  } = getCacheDirectories(options)

  // Config cache
  const prevOptions = await loadJsonToObject(lastOptionsCachePath)
  const optionsChanged = prevOptions && haveOptionsChanged(prevOptions, options)
  if (optionsChanged) {
    info("Options changed: Output will be regenerated")
  }

  const rootUUID = convertToUUID(options.rootId)
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

  info("Testing connection to Notion...")
  // Do a quick test to see if we can connect to the root so that we can give a better error than just a generic "could not find page" one.
  const rootObjectType = await getRootObjectType({
    cachedNotionClient,
    rootUUID,
    rootObjectType:
      options.rootObjectType == "auto"
        ? "auto"
        : PageOrDatabase.parse(options.rootObjectType),
  })

  group("Stage 1: walk children of the root page, looking for pages...")
  const stage1Start = performance.now()
  const objectsTree = await downloadNotionObjectTree(
    cachedNotionClient,
    { rootUUID, rootObjectType },
    options.cache
  )
  await saveObjectToJson(objectsTree.getRoot(), objectTreeCachePath)
  stageTimes["Stage 1"] = performance.now() - stage1Start
  endGroup()

  const assetsCacheFilesMap = await cacheNewAssets(
    options,
    assetsCacheDir,
    assetsCacheFilesMapPath,
    objectsTree
  )

  info("PULL: Notion Download Completed")

  debug(cachedNotionClient.stats)

  if (options.conversion.skip) {
    info("Skipping conversion phases")
    return
  }

  endGroup()
  group("Stage 2: Filtering pages...")
  const stage2Start = performance.now()
  filterTree(objectsTree, options.conversion.filters)
  stageTimes["Stage 2"] = performance.now() - stage2Start
  endGroup()

  group("Stage 3: Reading new assets...")
  const stage3Start = performance.now()
  const filesInMemory: FileBuffersMemory = {}
  await readOrDownloadNewAssets(
    objectsTree,
    assetsCacheFilesMap,
    existingFilesManager,
    filesInMemory,
    options.conversion.overwrite
  )
  stageTimes["Stage 3"] = performance.now() - stage3Start
  endGroup()

  group("Stage 4: Building paths...")
  const stage4Start = performance.now()
  // 4. Path building
  const layoutStrategies = createStrategies(
    options,
    objectsTree,
    newFilesManager
  )

  getFileTreeMap(
    "",
    objectsTree,
    options.rootDbAsFolder,
    layoutStrategies,
    existingFilesManager,
    newFilesManager,
    filesInMemory
  )

  await updateAssetFilePathsForMarkdown(objectsTree, newFilesManager)
  stageTimes["Stage 4"] = performance.now() - stage4Start
  endGroup()

  group("Stage 5: Saving new assets...")
  const stage5Start = performance.now()
  await saveNewAssets(
    objectsTree,
    existingFilesManager,
    newFilesManager,
    filesInMemory,
    options.conversion.overwrite
  )

  // 5. Save assets
  stageTimes["Stage 5"] = performance.now() - stage5Start
  endGroup()

  // Only output pages that changed! The rest already exist.
  group(`Stage 6: convert Notion pages to markdown...`)
  const stage6Start = performance.now()
  const pagesToOutput = getPagesToOutput(
    objectsTree,
    existingFilesManager,
    options.conversion.overwrite || optionsChanged
  )
  info(`Found ${objectsTree.getPages().length} pages`)
  info(`Found ${pagesToOutput.length} to output`)

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
  stageTimes["Stage 6"] = performance.now() - stage6Start
  endGroup()

  group("Stage 7: clean up old files & images...")
  const stage7Start = performance.now()
  await cleanupOldsFiles(existingFilesManager, newFilesManager)
  // Saving needs to happen at the end to prevent inconsistencies if fails mid execution
  await saveObjectToJson(optionsForLogging, lastOptionsCachePath)
  await saveDataToFile(newFilesManager.toJSON(), filesMapCachePath)
  stageTimes["Stage 7"] = performance.now() - stage7Start
  endGroup()

  group("Download report")
  for (const [key, value] of Object.entries(cachedNotionClient.stats)) {
    info(`${key}: ${value}`)
  }

  info("Stage execution times:")
  for (const [stage, time] of Object.entries(stageTimes)) {
    info(`${stage}: ${time.toFixed(2)}ms`)
  }

  const totalTime = performance.now() - startTime
  info(`Total execution time: ${totalTime.toFixed(2)}ms`)
  endGroup()
}

function getOptionsForLogging(options: NotionPullOptions) {
  // It's helpful when troubleshooting CI secrets and environment variables to see what options actually made it.
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
  const objectsDirectories: FilepathGroup = parsePathFileOptions(
    options.conversion.outputPaths
  )
  const markdownPrefixes: FilepathGroup = parsePathFileOptions(
    options.conversion.markdownPrefixes
  )
  return { objectsDirectories, markdownPrefixes }
}

async function setupFilesManagers(
  options: NotionPullOptions,
  objectsDirectories: FilepathGroup,
  markdownPrefixes: FilepathGroup,
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

async function cacheNewAssets(
  options: NotionPullOptions,
  assetsCacheDir: string,
  assetsCacheFilesMapPath: string,
  objectsTree: NotionObjectTree
) {
  if (!options.cache.cacheAssets) return undefined

  const assetsCacheFilesMap =
    loadAssetsCacheFilesMap(assetsCacheFilesMapPath) || new FilesMap()

  await preFetchAssets(objectsTree, assetsCacheDir, assetsCacheFilesMap)
  await saveDataToFile(assetsCacheFilesMap.toJSON(), assetsCacheFilesMapPath)

  return assetsCacheFilesMap
}

function getPagesToOutput(
  objectsTree: NotionObjectTree,
  existingFilesManager: FilesManager,
  overwrite: boolean
) {
  const pages = objectsTree.getPages().map((page) => new NotionPage(page))
  return pages.filter(
    (page) => overwrite || existingFilesManager.isObjectNew(page)
  )
}

async function outputPages(
  options: NotionPullOptions,
  config: IPluginsConfig,
  pages: Array<NotionPage>,
  client: Client,
  notionToMarkdown: NotionToMarkdown,
  filesManager: FilesManager
) {
  const context: IPluginContext = createContext(
    options,
    pages,
    client,
    notionToMarkdown,
    filesManager
  )

  for (const page of pages) {
    const mdPathWithRoot = filesManager.get(
      "output",
      ObjectType.enum.page,
      page.id
    )?.path
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
): IPluginContext {
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
  rootObjectType: PageOrDatabase | "auto"
  rootUUID: string
}): Promise<PageOrDatabase> {
  // TODO: Here it retries 10 times before exiting if we use the cache client
  try {
    let pageResult = undefined
    if (["auto", ObjectType.enum.page].includes(rootObjectType)) {
      try {
        pageResult = await cachedNotionClient.pages.retrieve({
          page_id: rootUUID,
        })
        return Promise.resolve(ObjectType.enum.page)
      } catch (e: any) {
        // Catch APIResponseError
        if (e.code !== "object_not_found") {
          throw e
        }
      }
    }
    if (
      ["auto", ObjectType.enum.database].includes(rootObjectType) ||
      !pageResult
    ) {
      await cachedNotionClient.databases.retrieve({ database_id: rootUUID })
      return Promise.resolve(ObjectType.enum.database)
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
    handleError(
      `notion downloader could not retrieve the root page from Notion. \r\na) Check that the root page id really is "${
        params.rootUUID
      }".\r\nb) Check that your Notion API token (the "Integration Secret") is correct.
      .\r\nc) Check that your root page includes your "integration" in its "connections".\r\nThis internal error message may help:\r\n    ${
        e.message as string
      }".\r\nd) Check that your root-is-db option is being used correctly. Current value is: ${
        params.rootObjectType
      }\r\n`
    )
  })
}

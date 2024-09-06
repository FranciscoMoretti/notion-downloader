import { exit } from "process"
import { Client } from "@notionhq/client"
import fs from "fs-extra"
import { NotionCacheClient } from "notion-cache-client"
import {
  NotionObjectTree,
  NotionObjectTreeNode,
  downloadObjectTree,
} from "notion-downloader"
import { NotionToMarkdown } from "notion-to-md"

import { FilesCleaner } from "./FilesCleaner"
import { FilesManager, ObjectPrefixDict } from "./FilesManager"
import { FileType, FilesMap } from "./FilesMap"
import { FlatLayoutStrategy } from "./FlatLayoutStrategy"
import { HierarchicalLayoutStrategy } from "./HierarchicalLayoutStrategy"
import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"
import { IDocuNotionConfig, loadConfigAsync } from "./config/configuration"
import { NotionPullOptions } from "./config/schema"
import { fetchImages } from "./fetchImages"
import { filterTree } from "./filterTree"
import { getBlockChildren } from "./getBlockChildren"
import { getFileTreeMap } from "./getFileTreeMap"
import { getStrategy } from "./getOutputImageFileName"
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
import { removePathExtension } from "./pathUtils"
import { convertInternalUrl } from "./plugins/internalLinks"
import { IDocuNotionContext } from "./plugins/pluginTypes"
import { applyToAllImages, readAndUpdateMetadata } from "./processImages"
import { getMarkdownForPage } from "./transform"
import {
  convertToUUID,
  getAncestorPageOrDatabaseFilename,
  getAncestorPageOrDatabaseFilepath,
  sanitizeMarkdownOutputPath,
  saveDataToJson,
  saveToFile,
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
const FILES_MAP_FILE_PATH = CACHE_FOLDER + "/" + "files_map.json"

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

function loadFilesManagerFile(filePath: string): FilesManager | undefined {
  if (fs.existsSync(filePath)) {
    const jsonData = fs.readFileSync(filePath, "utf8")
    return FilesManager.fromJSON(jsonData)
  }
  return undefined
}

function loadImagesCacheFilesMap(filePath: string): FilesMap | undefined {
  if (fs.existsSync(filePath)) {
    const jsonData = fs.readFileSync(filePath, "utf8")
    return FilesMap.fromJSON(jsonData)
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
    options.conversion.namingStrategy === "github-slug"
      ? new GithubSlugNamingStrategy(options.conversion.slugProperty || "")
      : options.conversion.namingStrategy === "notion-slug"
      ? new NotionSlugNamingStrategy(options.conversion.slugProperty || "")
      : options.conversion.namingStrategy === "guid"
      ? new GuidNamingStrategy()
      : new TitleNamingStrategy()
  const layoutStrategy =
    options.conversion.layoutStrategy === "FlatLayoutStrategy"
      ? new FlatLayoutStrategy(namingStrategy)
      : new HierarchicalLayoutStrategy(namingStrategy)

  const objectsDirectories: ObjectPrefixDict = {
    page: options.conversion.outputPaths.markdown,
    database: options.conversion.outputPaths.markdown,
    image: options.conversion.outputPaths.images,
  }

  const markdownPrefixes: ObjectPrefixDict = {
    page: "",
    database: "",
    image:
      options.conversion.markdownPrefixes.images ||
      options.conversion.outputPaths.images ||
      ".",
  }

  const filesMapFilePath =
    options.cwd.replace(/\/+$/, "") + "/" + FILES_MAP_FILE_PATH
  const previousFilesManager = loadFilesManagerFile(filesMapFilePath)

  if (previousFilesManager) {
    const prevDirs = previousFilesManager.getOutputDirectories()
    const currentDirs = objectsDirectories

    const keys = Object.keys(prevDirs) as FileType[]
    const dirsChanged = keys.some((key) => prevDirs[key] !== currentDirs[key])

    if (dirsChanged) {
      info("Output directories changed. Deleting all tracked files.")
      const filesCleaner = new FilesCleaner()
      await filesCleaner.cleanupAllFiles(previousFilesManager)
      previousFilesManager.reset()
      info("Output directories changed. Clearing the cache.")
      // Reset the cache since assets URLs could have changed (cover images, block images)
      cachedNotionClient.cache.clearCache()
      // TODO: Consider moving the image/asset files instead of removing them and clearing the cache
    }
  }

  const existingFilesManager =
    previousFilesManager ||
    new FilesManager({
      outputDirectories: objectsDirectories,
      markdownPrefixes: markdownPrefixes,
    })
  const newFilesManager = new FilesManager({
    outputDirectories: objectsDirectories,
    markdownPrefixes: markdownPrefixes,
  })

  await fs.mkdir(options.conversion.outputPaths.markdown, { recursive: true })
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
  const objectsTreeRootNode: NotionObjectTreeNode = await downloadObjectTree({
    client: cachedNotionClient,
    startingNode: {
      rootUUID: rootUUID,
      rootObjectType: rootObjectType,
    },
    dataOptions: {
      // TODO: Consider exposing this as options or making it a default input arg
      downloadAllPages: true,
      downloadDatabases: true,
      followLinks: true,
    },
    cachingOptions: options.cache,
  })

  await saveDataToJson(objectsTreeRootNode, cacheDir + "object_tree.json")

  const objectsData = await getAllObjectsInObjectsTree(
    objectsTreeRootNode,
    cachedNotionClient
  )

  const objectsTree = new NotionObjectTree(objectsTreeRootNode, objectsData)

  let imagesCacheFilesMap: FilesMap | undefined = undefined
  if (options.cache.cacheImages) {
    const imagesCacheDir = cacheDir + "images/"
    imagesCacheFilesMap =
      loadImagesCacheFilesMap(imagesCacheDir + "images_filesmap.json") ||
      new FilesMap()

    await fetchImages(objectsTree, imagesCacheDir, imagesCacheFilesMap)
    await saveToFile(
      imagesCacheFilesMap.toJSON(),
      imagesCacheDir + "images_filesmap.json"
    )
  }

  info("PULL: Notion Download Completed")
  if (options.conversion.skip) {
    return
  }

  endGroup()
  group("Stage 2: Filtering pages...")

  filterTree(
    objectsTree,
    // TODO: Include more filters here
    options.conversion.statusPropertyName,
    options.conversion.statusPropertyValue
  )

  endGroup()

  group("Stage 3: Building paths...")

  // --------  FILES ---------
  getFileTreeMap(
    "", // Start context
    objectsTree,
    options.rootDbAsFolder,
    layoutStrategy,
    newFilesManager
  )
  endGroup()

  group("Stage 4: Image download...")

  const imageNamingStrategy: ImageNamingStrategy = getStrategy(
    options.conversion.imageNamingStrategy || "default",
    // TODO: A new strategy could be with ancestor filename `getAncestorPageOrDatabaseFilename`
    (image) =>
      options.conversion.imageNamingStrategy == "default"
        ? removePathExtension(
            getAncestorPageOrDatabaseFilepath(
              image,
              objectsTree,
              newFilesManager
            )
          )
        : options.conversion.imageNamingStrategy == "default-flat"
        ? getAncestorPageOrDatabaseFilename(image, objectsTree, newFilesManager)
        : ""
  )

  // Process images saves them to the filesMap and also updates the markdown files
  await applyToAllImages({
    objectsTree,
    applyToImage: async (image) => {
      await readAndUpdateMetadata({
        image,
        existingFilesManager,
        newFilesManager,
        imageNamingStrategy,
        imagesCacheFilesMap,
      })
    },
  })

  endGroup()

  // Only output pages that changed! The rest already exist.
  const pages = objectsTree.getPages().map((page) => new NotionPage(page))
  const pagesToOutput = pages.filter((page) => {
    return existingFilesManager.isObjectNew(page)
  })
  info(`Found ${pages.length} pages`)
  info(`Found ${pagesToOutput.length} new pages`)
  group(`Stage 5: convert ${pagesToOutput.length} Notion pages to markdown...`)

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

  const filesCleaner = new FilesCleaner()
  await filesCleaner.cleanupOldFiles(existingFilesManager, newFilesManager)
  await saveToFile(newFilesManager.toJSON(), filesMapFilePath)
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
  filesManager: FilesManager
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
    filesManager: filesManager,
    counts: counts, // review will this get copied or pointed to?
    imports: [],
    convertNotionLinkToLocalDocusaurusLink: (url: string) =>
      convertInternalUrl(context, url),
  }
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

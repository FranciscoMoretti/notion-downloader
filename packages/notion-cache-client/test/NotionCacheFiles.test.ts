import * as fs from "fs"
import * as path from "path"
import { createTempDir } from "@notion-fixtures/fixtures/utils"
import { describe, expect, it } from "vitest"

import { NotionCacheFiles } from "../src/NotionCacheFiles"
import { loadDataFromJson } from "../src/utils"

const blockChildrenCacheFilename = "block_children_cache.json"
const databaseChildrenCacheFilename = "database_children_cache.json"
const pageObjectsCacheFilename = "page_objects_cache.json"
const databaseObjectsCacheFilename = "database_objects_cache.json"
const blockObjectsCacheFilename = "block_objects_cache.json"

describe("NotionCacheFiles", () => {
  it("loads cache from file system", async () => {
    const cacheDirectory = await createTempDir()
    const notionCacheFiles = new NotionCacheFiles(cacheDirectory)
    // Create some sample cache files
    fs.writeFileSync(
      path.join(cacheDirectory, blockChildrenCacheFilename),
      JSON.stringify({ foo: "bar" })
    )
    fs.writeFileSync(
      path.join(cacheDirectory, databaseChildrenCacheFilename),
      JSON.stringify({ baz: "qux" })
    )
    fs.writeFileSync(
      path.join(cacheDirectory, pageObjectsCacheFilename),
      JSON.stringify({ quux: "corge" })
    )
    fs.writeFileSync(
      path.join(cacheDirectory, databaseObjectsCacheFilename),
      JSON.stringify({ grault: "garply" })
    )
    fs.writeFileSync(
      path.join(cacheDirectory, blockObjectsCacheFilename),
      JSON.stringify({ waldo: "fred" })
    )

    // Load the cache
    const {
      blocksChildrenCache,
      databaseChildrenCache,
      pageObjectsCache,
      databaseObjectsCache,
      blockObjectsCache,
    } = await notionCacheFiles.loadCache()

    // Verify the cache is loaded correctly
    expect(blocksChildrenCache).toEqual({ foo: "bar" })
    expect(databaseChildrenCache).toEqual({ baz: "qux" })
    expect(pageObjectsCache).toEqual({ quux: "corge" })
    expect(databaseObjectsCache).toEqual({ grault: "garply" })
    expect(blockObjectsCache).toEqual({ waldo: "fred" })
  })

  it("saves cache to file system", async () => {
    const cacheDirectory = await createTempDir()
    const notionCacheFiles = new NotionCacheFiles(cacheDirectory)
    // Set some sample cache data
    const blocksChildrenCache = { foo: "bar" } as any
    const databaseChildrenCache = { baz: "qux" } as any
    const databaseObjectsCache = { grault: "garply" } as any
    const blockObjectsCache = { waldo: "fred" } as any
    const pageObjectsCache = { quux: "corge" } as any

    // Save the cache
    await notionCacheFiles.saveCache({
      blocksChildrenCache,
      databaseChildrenCache,
      pageObjectsCache,
      databaseObjectsCache,
      blockObjectsCache,
    })

    // Verify the cache files exist
    expect(
      fs.existsSync(path.join(cacheDirectory, blockChildrenCacheFilename))
    ).toBe(true)
    expect(
      fs.existsSync(path.join(cacheDirectory, databaseChildrenCacheFilename))
    ).toBe(true)
    expect(
      fs.existsSync(path.join(cacheDirectory, databaseObjectsCacheFilename))
    ).toBe(true)
    expect(
      fs.existsSync(path.join(cacheDirectory, blockObjectsCacheFilename))
    ).toBe(true)
    expect(
      fs.existsSync(path.join(cacheDirectory, pageObjectsCacheFilename))
    ).toBe(true)

    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, blockChildrenCacheFilename)
      )
    ).toEqual({ foo: "bar" })
    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, databaseChildrenCacheFilename)
      )
    ).toEqual({ baz: "qux" })
    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, databaseObjectsCacheFilename)
      )
    ).toEqual({ grault: "garply" })
    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, blockObjectsCacheFilename)
      )
    ).toEqual({ waldo: "fred" })
    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, pageObjectsCacheFilename)
      )
    ).toEqual({ quux: "corge" })
  })
})

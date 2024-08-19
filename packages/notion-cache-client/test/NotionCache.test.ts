import * as fs from "fs"
import * as path from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { NotionCache } from "../src/NotionCache"
import { loadDataFromJson, saveDataToJson } from "../src/utils"
import { createTempDir } from "./utils"

describe("NotionCacheFiles", () => {
  it("loads cache from file system", async () => {
    const cacheDirectory = await createTempDir()
    const notionCache = new NotionCache({
      cacheDirectory,
    })
    // Create some sample cache files
    fs.writeFileSync(
      path.join(cacheDirectory, "block_children_cache.json"),
      JSON.stringify({ foo: "bar" })
    )
    fs.writeFileSync(
      path.join(cacheDirectory, "database_children_cache.json"),
      JSON.stringify({ baz: "qux" })
    )
    fs.writeFileSync(
      path.join(cacheDirectory, "page_objects_cache.json"),
      JSON.stringify({ quux: "corge" })
    )
    fs.writeFileSync(
      path.join(cacheDirectory, "database_objects_cache.json"),
      JSON.stringify({ grault: "garply" })
    )
    fs.writeFileSync(
      path.join(cacheDirectory, "block_objects_cache.json"),
      JSON.stringify({ waldo: "fred" })
    )

    // Load the cache
    await notionCache.loadCache()

    // Verify the cache is loaded correctly
    expect(notionCache.blocksChildrenCache).toEqual({ foo: "bar" })
    expect(notionCache.databaseChildrenCache).toEqual({ baz: "qux" })
    expect(notionCache.pageObjectsCache).toEqual({ quux: "corge" })
    expect(notionCache.databaseObjectsCache).toEqual({ grault: "garply" })
    expect(notionCache.blockObjectsCache).toEqual({ waldo: "fred" })
  })

  it("saves cache to file system", async () => {
    const cacheDirectory = await createTempDir()
    const notionCache = new NotionCache({
      cacheDirectory,
    })
    // Set some sample cache data
    notionCache.blocksChildrenCache = { foo: "bar" } as any
    notionCache.databaseChildrenCache = { baz: "qux" } as any
    notionCache.databaseObjectsCache = { grault: "garply" } as any
    notionCache.blockObjectsCache = { waldo: "fred" } as any
    notionCache.pageObjectsCache = { quux: "corge" } as any

    // Save the cache
    await notionCache.saveCache()

    // Verify the cache files exist
    expect(
      fs.existsSync(path.join(cacheDirectory, "block_children_cache.json"))
    ).toBe(true)
    expect(
      fs.existsSync(path.join(cacheDirectory, "database_children_cache.json"))
    ).toBe(true)
    expect(
      fs.existsSync(path.join(cacheDirectory, "database_objects_cache.json"))
    ).toBe(true)
    expect(
      fs.existsSync(path.join(cacheDirectory, "block_objects_cache.json"))
    ).toBe(true)
    expect(
      fs.existsSync(path.join(cacheDirectory, "page_objects_cache.json"))
    ).toBe(true)

    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, "block_children_cache.json")
      )
    ).toEqual({ foo: "bar" })
    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, "database_children_cache.json")
      )
    ).toEqual({ baz: "qux" })
    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, "database_objects_cache.json")
      )
    ).toEqual({ grault: "garply" })
    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, "block_objects_cache.json")
      )
    ).toEqual({ waldo: "fred" })
    expect(
      await loadDataFromJson(
        path.join(cacheDirectory, "page_objects_cache.json")
      )
    ).toEqual({ quux: "corge" })
  })
})

import path from "path"
import { expect, test } from "vitest"

import { getConfig, getRawConfig } from "../../src/utils/get-config"

test("get raw config", async () => {
  expect(
    await getRawConfig(path.resolve(__dirname, "../fixtures/config-none"))
  ).toEqual(null)

  expect(
    await getRawConfig(path.resolve(__dirname, "../fixtures/config-partial"))
  ).toEqual({
    rootObjectType: "page",
  })

  await expect(
    getRawConfig(path.resolve(__dirname, "../fixtures/config-invalid"))
  ).rejects.toThrowError()
})

test("get config", async () => {
  expect(
    await getConfig(path.resolve(__dirname, "../fixtures/config-none"))
  ).toEqual(null)

  await expect(
    getConfig(path.resolve(__dirname, "../fixtures/config-invalid"))
  ).rejects.toThrowError()

  expect(
    await getConfig(path.resolve(__dirname, "../fixtures/config-partial"))
  ).toEqual({
    rootObjectType: "page",
  })

  expect(
    await getConfig(path.resolve(__dirname, "../fixtures/config-full"))
  ).toEqual({
    rootId: "c974ccd9c70c4abd8a5bd4f5a294e5dd",
    rootObjectType: "page",
    cache: {
      cacheDirectory: "./.downloader",
      cleanCache: false,
      cacheStrategy: "cache",
      cacheAssets: true,
    },
    conversion: {
      skip: false,
      overwrite: false,
      filters: [],
      markdownExtension: "md",
      pageLinkHasExtension: true,
      outputPaths: "./content",
      markdownPrefixes: "",
      layoutStrategy: "hierarchical",
      namingStrategy: "default",
      plugins: [],
    },
  })
})

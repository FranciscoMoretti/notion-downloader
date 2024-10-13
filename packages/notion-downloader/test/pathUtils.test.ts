import path from "path"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import {
  addPathPrefix,
  removePathExtension,
  removePathPrefix,
} from "../src/files/pathUtils"

describe("addPathPrefix", () => {
  test("adds prefix to relative path", () => {
    expect(addPathPrefix("foo/bar", "/prefix")).toBe(
      path.normalize("/prefix/foo/bar")
    )
  })

  test("no prefix maintains the original path", () => {
    expect(addPathPrefix("/foo/bar", "")).toBe(path.normalize("/foo/bar"))
  })

  test("modifies absolute path", () => {
    expect(addPathPrefix("/foo/bar", "/prefix")).toBe(
      path.normalize("/prefix/foo/bar")
    )
  })

  test("handles empty prefix", () => {
    expect(addPathPrefix("foo/bar", "")).toBe(path.normalize("foo/bar"))
  })

  test("normalizes paths", () => {
    expect(addPathPrefix("foo//bar", "prefix/")).toBe(
      path.normalize("prefix/foo/bar")
    )
  })

  test("paths need resolving", () => {
    expect(addPathPrefix("./foo/bar", "prefix")).toBe(
      path.normalize("prefix/foo/bar")
    )
  })
})

describe("removePathPrefix", () => {
  test("removes prefix from path", () => {
    expect(removePathPrefix("/prefix/foo/bar", "/prefix")).toBe("/foo/bar")
  })

  test("handles exact match", () => {
    expect(removePathPrefix("/prefix", "/prefix")).toBe("")
  })

  test("handles trailing separator in prefix", () => {
    expect(removePathPrefix("/prefix/foo/bar", "/prefix/")).toBe("/foo/bar")
  })

  test("throws error for paths without common prefix", () => {
    expect(() => removePathPrefix("/other/foo/bar", "/prefix")).toThrow(
      "Path does not start with the given prefix"
    )
  })
})

describe("removePathExtension", () => {
  test("removes extension from file path", () => {
    expect(removePathExtension("/foo/bar.txt")).toBe("/foo/bar")
  })

  test("handles path without extension", () => {
    expect(removePathExtension("/foo/bar")).toBe("/foo/bar")
  })

  test("handles path with multiple dots", () => {
    expect(removePathExtension("/foo/bar.test.js")).toBe("/foo/bar.test")
  })

  test("handles relative paths", () => {
    expect(removePathExtension("./foo/bar.md")).toBe("foo/bar")
  })

  test("handles paths with only filename", () => {
    expect(removePathExtension("file.txt")).toBe("file")
  })
})

describe("Path utils with different separators", () => {
  const originalPlatform = process.platform
  const originalSep = path.sep
  const originalJoin = path.join
  const originalNormalize = path.normalize

  beforeEach(() => {
    vi.mock("path", async () => {
      const actual = await vi.importActual("path")
      return {
        ...actual,
        sep: "/",
        join: (...paths: string[]) => paths.join("/"),
        normalize: (p: string) => p.replace(/\\/g, "/"),
      }
    })
  })

  afterEach(() => {
    vi.unmock("path")
    Object.defineProperty(process, "platform", { value: originalPlatform })
    Object.defineProperty(path, "sep", { value: originalSep })
    Object.defineProperty(path, "join", { value: originalJoin })
    Object.defineProperty(path, "normalize", { value: originalNormalize })
  })

  test("addPathPrefix with POSIX separators", () => {
    expect(addPathPrefix("foo/bar", "/prefix")).toBe("/prefix/foo/bar")
  })

  test("addPathPrefix with Windows separators", () => {
    Object.defineProperty(path, "sep", { value: "\\" })
    Object.defineProperty(path, "join", {
      value: (...paths: string[]) => paths.join("\\"),
    })
    Object.defineProperty(path, "normalize", {
      value: (p: string) => p.replace(/\//g, "\\"),
    })

    expect(addPathPrefix("foo\\bar", "C:\\prefix")).toBe("C:\\prefix\\foo\\bar")
  })
})

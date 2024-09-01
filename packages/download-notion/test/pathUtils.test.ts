import path from "path"
import { describe, expect, test } from "vitest"

import {
  addPathPrefix,
  removePathExtension,
  removePathPrefix,
} from "../src/pathUtils"

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

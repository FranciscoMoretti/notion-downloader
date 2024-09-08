import { ObjectPrefixDict } from "@/src/FilesManager"
import { beforeEach, describe, expect, test } from "vitest"

import { FileRecord, FilesMap } from "../src/files/FilesMap"

describe("FilesMap", () => {
  let filesMap: FilesMap

  beforeEach(() => {
    filesMap = new FilesMap()
  })

  test("exists() returns false for non-existent record", () => {
    expect(filesMap.exists("page", "nonexistent")).toBe(false)
  })

  test("set() and exists() work correctly", () => {
    const record: FileRecord = {
      path: "/pages/test.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    filesMap.set("page", "test-id", record)
    expect(filesMap.exists("page", "test-id")).toBe(true)
  })

  test("get() returns correct record", () => {
    const record: FileRecord = {
      path: "/pages/test.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    filesMap.set("page", "test-id", record)
    expect(filesMap.get("page", "test-id")).toEqual(record)
  })

  test("get() throws error for non-existent record", () => {
    expect(() => filesMap.get("page", "nonexistent")).toThrow(
      "File record not found for page nonexistent"
    )
  })

  test("delete() removes record", () => {
    const record: FileRecord = {
      path: "/pages/test.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    filesMap.set("page", "test-id", record)
    filesMap.delete("page", "test-id")
    expect(filesMap.exists("page", "test-id")).toBe(false)
  })

  test("getAllOfType() returns correct records", () => {
    const record1: FileRecord = {
      path: "/pages/test1.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    const record2: FileRecord = {
      path: "/pages/test2.md",
      lastEditedTime: "2023-04-02T12:00:00Z",
    }
    filesMap.set("page", "test-id-1", record1)
    filesMap.set("page", "test-id-2", record2)
    expect(filesMap.getAllOfType("page")).toEqual({
      "test-id-1": record1,
      "test-id-2": record2,
    })
  })

  test("getAll() returns all records", () => {
    const pageRecord: FileRecord = {
      path: "/pages/test.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    const dbRecord: FileRecord = {
      path: "/databases/test.csv",
      lastEditedTime: "2023-04-02T12:00:00Z",
    }
    filesMap.set("page", "page-id", pageRecord)
    filesMap.set("database", "db-id", dbRecord)
    expect(filesMap.getAll()).toEqual({
      page: { "page-id": pageRecord },
      database: { "db-id": dbRecord },
      image: {},
    })
  })

  test("toJson() and fromJson() work correctly", () => {
    const record: FileRecord = {
      path: "/pages/test.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    filesMap.set("page", "test-id", record)
    const json = filesMap.toJSON()
    const newFilesMap = FilesMap.fromJSON(json)
    expect(newFilesMap.get("page", "test-id")).toEqual(record)
  })
})

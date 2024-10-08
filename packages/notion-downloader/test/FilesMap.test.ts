import { AssetType } from "@/src/config/schema"
import { ObjectType } from "notion-cache-client"
import { beforeEach, describe, expect, test } from "vitest"

import { FileRecord, FilesMap } from "../src/files/FilesMap"

describe("FilesMap", () => {
  let filesMap: FilesMap

  beforeEach(() => {
    filesMap = new FilesMap()
  })

  test("exists() returns false for non-existent record", () => {
    expect(filesMap.exists(ObjectType.enum.page, "nonexistent")).toBe(false)
  })

  test("set() and exists() work correctly", () => {
    const record: FileRecord = {
      path: "/pages/test.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    filesMap.set(ObjectType.enum.page, "test-id", record)
    expect(filesMap.exists(ObjectType.enum.page, "test-id")).toBe(true)
  })

  test("get() returns correct record", () => {
    const record: FileRecord = {
      path: "/pages/test.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    filesMap.set(ObjectType.enum.page, "test-id", record)
    expect(filesMap.get(ObjectType.enum.page, "test-id")).toEqual(record)
  })

  test("get() throws error for non-existent record", () => {
    expect(() => filesMap.get(ObjectType.enum.page, "nonexistent")).toThrow(
      "File record not found for page nonexistent"
    )
  })

  test("delete() removes record", () => {
    const record: FileRecord = {
      path: "/pages/test.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    filesMap.set(ObjectType.enum.page, "test-id", record)
    filesMap.delete(ObjectType.enum.page, "test-id")
    expect(filesMap.exists(ObjectType.enum.page, "test-id")).toBe(false)
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
    filesMap.set(ObjectType.enum.page, "test-id-1", record1)
    filesMap.set(ObjectType.enum.page, "test-id-2", record2)
    expect(filesMap.getAllOfType(ObjectType.enum.page)).toEqual({
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
    filesMap.set(ObjectType.enum.page, "page-id", pageRecord)
    filesMap.set(ObjectType.enum.database, "db-id", dbRecord)
    expect(filesMap.getAll()).toEqual({
      [ObjectType.enum.page]: { "page-id": pageRecord },
      [ObjectType.enum.database]: { "db-id": dbRecord },
      [AssetType.enum.image]: {},
      [AssetType.enum.file]: {},
      [AssetType.enum.video]: {},
      [AssetType.enum.pdf]: {},
      [AssetType.enum.audio]: {},
    })
  })

  test("toJson() and fromJson() work correctly", () => {
    const record: FileRecord = {
      path: "/pages/test.md",
      lastEditedTime: "2023-04-01T12:00:00Z",
    }
    filesMap.set(ObjectType.enum.page, "test-id", record)
    const json = filesMap.toJSON()
    const newFilesMap = FilesMap.fromJSON(json)
    expect(newFilesMap.get(ObjectType.enum.page, "test-id")).toEqual(record)
  })
})

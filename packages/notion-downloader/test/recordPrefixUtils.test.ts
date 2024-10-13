import { FilepathGroup } from "@/src/config/schema"
import { describe, expect, test } from "vitest"

import { FileRecord, FilesMapData } from "../src/files/FilesMap"
import {
  recordMapWithPrefix,
  recordMapWithoutPrefix,
  recordWithPrefix,
  recordWithoutPrefix,
  toMapDataWithPrefix,
  toMapDataWithoutPrefix,
} from "../src/files/recordPrefixUtils"

describe("recordPrefixUtils", () => {
  const sampleFileRecord: FileRecord = {
    path: "path/to/file.txt",
    lastEditedTime: "2023-04-01T12:00:00Z",
  }

  const sampleFilesMapData: FilesMapData = {
    page: { "page-id": sampleFileRecord },
    database: { "db-id": sampleFileRecord },
    image: { "image-id": sampleFileRecord },
    file: { "file-id": sampleFileRecord },
    video: { "video-id": sampleFileRecord },
    pdf: { "pdf-id": sampleFileRecord },
    audio: { "audio-id": sampleFileRecord },
  }

  const samplePrefixes: FilepathGroup = {
    page: "pages",
    database: "databases",
    image: "images",
    file: "files",
    video: "videos",
    pdf: "pdfs",
    audio: "audios",
  }

  test("recordWithPrefix", () => {
    const result = recordWithPrefix(sampleFileRecord, "prefix")
    expect(result.path).toBe("prefix/path/to/file.txt")
    expect(result.lastEditedTime).toBe(sampleFileRecord.lastEditedTime)
  })

  test("recordWithoutPrefix", () => {
    const recordWithPrefix = {
      ...sampleFileRecord,
      path: "prefix/path/to/file.txt",
    }
    const result = recordWithoutPrefix(recordWithPrefix, "prefix")
    expect(result.path).toBe("/path/to/file.txt")
    expect(result.lastEditedTime).toBe(sampleFileRecord.lastEditedTime)
  })

  test("recordMapWithPrefix", () => {
    const result = recordMapWithPrefix(sampleFilesMapData.page, "pages")
    expect(result["page-id"].path).toBe("pages/path/to/file.txt")
  })

  test("recordMapWithoutPrefix", () => {
    const recordMapWithPrefix = {
      "page-id": { ...sampleFileRecord, path: "pages/path/to/file.txt" },
    }
    const result = recordMapWithoutPrefix(recordMapWithPrefix, "pages")
    expect(result["page-id"].path).toBe("/path/to/file.txt")
  })

  test("toMapDataWithPrefix", () => {
    const result = toMapDataWithPrefix(sampleFilesMapData, samplePrefixes)
    expect(result.page["page-id"].path).toBe("pages/path/to/file.txt")
    expect(result.database["db-id"].path).toBe("databases/path/to/file.txt")
    expect(result.image["image-id"].path).toBe("images/path/to/file.txt")
  })

  test("toMapDataWithoutPrefix", () => {
    const sampleFilesMapDataWithPrefix: FilesMapData = {
      page: {
        "page-id": { ...sampleFileRecord, path: "pages/path/to/file.txt" },
      },
      database: {
        "db-id": { ...sampleFileRecord, path: "databases/path/to/file.txt" },
      },
      image: {
        "image-id": { ...sampleFileRecord, path: "images/path/to/file.txt" },
      },
      file: {
        "file-id": { ...sampleFileRecord, path: "files/path/to/file.txt" },
      },
      video: {
        "video-id": { ...sampleFileRecord, path: "videos/path/to/file.txt" },
      },
      pdf: {
        "pdf-id": { ...sampleFileRecord, path: "pdfs/path/to/file.txt" },
      },
      audio: {
        "audio-id": { ...sampleFileRecord, path: "audios/path/to/file.txt" },
      },
    }

    const result = toMapDataWithoutPrefix(
      sampleFilesMapDataWithPrefix,
      samplePrefixes
    )
    expect(result.page["page-id"].path).toBe("/path/to/file.txt")
    expect(result.database["db-id"].path).toBe("/path/to/file.txt")
    expect(result.image["image-id"].path).toBe("/path/to/file.txt")
    expect(result.file["file-id"].path).toBe("/path/to/file.txt")
    expect(result.video["video-id"].path).toBe("/path/to/file.txt")
    expect(result.pdf["pdf-id"].path).toBe("/path/to/file.txt")
    expect(result.audio["audio-id"].path).toBe("/path/to/file.txt")
  })
})

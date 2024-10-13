import { FilepathGroup } from "../config/schema"
import { FileRecord, FilesMapData, allRecordTypes } from "./FilesMap"
import { addPathPrefix, removePathPrefix } from "./pathUtils"

export function recordMapWithPrefix(
  recordMap: Record<string, FileRecord>,
  prefix: string
): Record<string, FileRecord> {
  return Object.fromEntries(
    Object.entries(recordMap).map(
      ([id, record]: [string, FileRecord]): [string, FileRecord] => [
        id,
        recordWithPrefix(record, prefix),
      ]
    )
  )
}

export function recordMapWithoutPrefix(
  recordMap: Record<string, FileRecord>,
  prefix: string
): Record<string, FileRecord> {
  return Object.fromEntries(
    Object.entries(recordMap).map(
      ([id, record]: [string, FileRecord]): [string, FileRecord] => [
        id,
        recordWithoutPrefix(record, prefix),
      ]
    )
  )
}

export function recordWithPrefix(
  record: FileRecord,
  prefix: string
): FileRecord {
  const newPath = addPathPrefix(record.path, prefix)

  return {
    ...record,
    path: newPath,
  }
}

export function recordWithoutPrefix(
  record: FileRecord,
  prefix: string
): FileRecord {
  const newPath = removePathPrefix(record.path, prefix)

  return {
    ...record,
    path: newPath,
  }
}

export function toMapDataWithPrefix(
  filesMapData: FilesMapData,
  prefixes: FilepathGroup
): FilesMapData {
  return Object.fromEntries(
    allRecordTypes.map((type) => [
      type,
      recordMapWithPrefix(filesMapData[type], prefixes[type]),
    ])
  ) as FilesMapData
}

export function toMapDataWithoutPrefix(
  filesMapData: FilesMapData,
  prefixes: FilepathGroup
): FilesMapData {
  return Object.fromEntries(
    allRecordTypes.map((type) => [
      type,
      recordMapWithoutPrefix(filesMapData[type], prefixes[type]),
    ])
  ) as FilesMapData
}

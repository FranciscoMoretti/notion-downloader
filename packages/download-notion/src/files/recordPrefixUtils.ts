import { ObjectPrefixDict } from "./FilesManager"
import { FileRecord, FilesMapData } from "./FilesMap"
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
  prefixes: ObjectPrefixDict
): FilesMapData {
  return {
    page: recordMapWithPrefix(filesMapData.page, prefixes.page),
    database: recordMapWithPrefix(filesMapData.database, prefixes.database),
    image: recordMapWithPrefix(filesMapData.image, prefixes.image),
  }
}
export function toMapDataWithoutPrefix(
  filesMapData: FilesMapData,
  prefixes: ObjectPrefixDict
): FilesMapData {
  return {
    page: recordMapWithoutPrefix(filesMapData.page, prefixes.page),
    database: recordMapWithoutPrefix(filesMapData.database, prefixes.database),
    image: recordMapWithoutPrefix(filesMapData.image, prefixes.image),
  }
}

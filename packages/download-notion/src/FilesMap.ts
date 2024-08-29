import { addPathPrefix, removePathPrefix } from "./pathUtils"

export type FileRecord = {
  path: string
  lastEditedTime: string
}

export type FileType = "page" | "database" | "image"

export type FilesMapData = Record<FileType, Record<string, FileRecord>>

export type ObjectsDirectories = Record<FileType, string>

export class FilesMap {
  private map: FilesMapData = {
    page: {},
    database: {},
    image: {},
  }

  exists(type: FileType, id: string): boolean {
    return !!this.map[type][id]
  }

  get(type: FileType, id: string): FileRecord {
    // If the record is not found, throw an error
    const record = this.map[type][id]
    if (!record) {
      throw new Error(`File record not found for ${type} ${id}`)
    }
    return record
  }

  set(type: FileType, id: string, record: FileRecord): void {
    this.map[type][id] = record
  }

  delete(type: FileType, id: string): void {
    delete this.map[type][id]
  }

  getAllOfType(type: FileType): Record<string, FileRecord> {
    return this.map[type]
  }

  getAll(): FilesMapData {
    return this.map
  }

  static fromJson(json: string): FilesMap {
    const map = new FilesMap()
    const parsed = JSON.parse(json)
    map.map = parsed
    return map
  }

  toJson(): string {
    return JSON.stringify(this.map)
  }

  recordToRootRelativePath(fileRecord: FileRecord, prefix: string): FileRecord {
    return recordWithPathPrefix(fileRecord, prefix)
  }

  recordToDirectoriesRelativePath(
    fileRecord: FileRecord,
    prefix: string
  ): FileRecord {
    return recordWithoutPathPrefix(fileRecord, prefix)
  }

  // TODO: Move relative to root and to directories to FilesManager
  static allToRootRelativePath(
    filesMap: FilesMap,
    objectsDirectories: ObjectsDirectories
  ): FilesMap {
    const {
      page: pagesDirectory,
      database: databasesDirectory,
      image: imagesDirectory,
    } = objectsDirectories
    const { page, database, image } = filesMap.getAll()

    const fromRootFilesMapData: FilesMapData = {
      page: recordMapWithPathPrefix(page, pagesDirectory),
      database: recordMapWithPathPrefix(database, databasesDirectory),
      image: recordMapWithPathPrefix(image, imagesDirectory),
    }
    const fromRootFilesMap = new FilesMap()
    fromRootFilesMap.map = fromRootFilesMapData
    return fromRootFilesMap
  }

  static allToDirectoriesRelativePath(
    filesMap: FilesMap,
    objectsDirectories: ObjectsDirectories
  ): FilesMap {
    const {
      page: pagesDirectory,
      database: databasesDirectory,
      image: imagesDirectory,
    } = objectsDirectories
    const { page, database, image } = filesMap.getAll()

    const toDirectoriesFilesMapData: FilesMapData = {
      page: recordMapWithoutPathPrefix(page, pagesDirectory),
      database: recordMapWithoutPathPrefix(database, databasesDirectory),
      image: recordMapWithoutPathPrefix(image, imagesDirectory),
    }
    const toDirectoriesFilesMap = new FilesMap()
    toDirectoriesFilesMap.map = toDirectoriesFilesMapData
    return toDirectoriesFilesMap
  }
}

export function recordMapWithPathPrefix(
  recordMap: Record<string, FileRecord>,
  prefix: string
): Record<string, FileRecord> {
  return Object.fromEntries(
    Object.entries(recordMap).map(
      ([id, record]: [string, FileRecord]): [string, FileRecord] => [
        id,
        recordWithPathPrefix(record, prefix),
      ]
    )
  )
}

export function recordMapWithoutPathPrefix(
  recordMap: Record<string, FileRecord>,
  prefix: string
): Record<string, FileRecord> {
  return Object.fromEntries(
    Object.entries(recordMap).map(
      ([id, record]: [string, FileRecord]): [string, FileRecord] => [
        id,
        recordWithoutPathPrefix(record, prefix),
      ]
    )
  )
}

function recordWithPathPrefix(record: FileRecord, prefix: string): FileRecord {
  const newPath = addPathPrefix(record.path, prefix)

  return {
    ...record,
    path: newPath,
  }
}

function recordWithoutPathPrefix(
  record: FileRecord,
  prefix: string
): FileRecord {
  const newPath = removePathPrefix(record.path, prefix)

  return {
    ...record,
    path: newPath,
  }
}

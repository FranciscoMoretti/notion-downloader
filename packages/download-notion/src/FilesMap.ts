import { addPathPrefix, removePathPrefix } from "./pathUtils"

export type FileRecord = {
  path: string
  lastEditedTime: string
}

export type FileType = "page" | "database" | "image"

export type FilesMapData = Record<FileType, Record<string, FileRecord>>

export type ObjectPrefixDict = Record<FileType, string>

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

  // TODO: Move this functions to utilities outside of this class
  static allToPathWithPrefix(
    filesMap: FilesMap,
    objectsDirectories: ObjectPrefixDict
  ): FilesMap {
    const {
      page: pagesDirectory,
      database: databasesDirectory,
      image: imagesDirectory,
    } = objectsDirectories
    const { page, database, image } = filesMap.getAll()

    const fromRootFilesMapData: FilesMapData = {
      page: recordMapWithPrefix(page, pagesDirectory),
      database: recordMapWithPrefix(database, databasesDirectory),
      image: recordMapWithPrefix(image, imagesDirectory),
    }
    const fromRootFilesMap = new FilesMap()
    fromRootFilesMap.map = fromRootFilesMapData
    return fromRootFilesMap
  }

  static allToPathWithoutPrefix(
    filesMap: FilesMap,
    objectsDirectories: ObjectPrefixDict
  ): FilesMap {
    const {
      page: pagesDirectory,
      database: databasesDirectory,
      image: imagesDirectory,
    } = objectsDirectories
    const { page, database, image } = filesMap.getAll()

    const toDirectoriesFilesMapData: FilesMapData = {
      page: recordMapWithoutPrefix(page, pagesDirectory),
      database: recordMapWithoutPrefix(database, databasesDirectory),
      image: recordMapWithoutPrefix(image, imagesDirectory),
    }
    const toDirectoriesFilesMap = new FilesMap()
    toDirectoriesFilesMap.map = toDirectoriesFilesMapData
    return toDirectoriesFilesMap
  }
}

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

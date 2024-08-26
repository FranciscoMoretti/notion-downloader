import path from "path"

export type FileRecord = {
  path: string
  lastEditedTime: string
}

type FileType = "page" | "database" | "image"

type FilesMapData = Record<FileType, Record<string, FileRecord>>

export type ObjectsDirectories = {
  pagesDirectory: string
  databasesDirectory: string
  imagesDirectory: string
}

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

  getAll(): Record<FileType, Record<string, FileRecord>> {
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

  toRootRelativePath(
    filesMap: FilesMap,
    objectsDirectories: ObjectsDirectories
  ): FilesMap {
    const { pagesDirectory, databasesDirectory, imagesDirectory } =
      objectsDirectories
    const { page, database, image } = filesMap.getAll()

    const fromRootFilesMapData: FilesMapData = {
      page: withPathPrefix(page, pagesDirectory),
      database: withPathPrefix(database, databasesDirectory),
      image: withPathPrefix(image, imagesDirectory),
    }
    const fromRootFilesMap = new FilesMap()
    fromRootFilesMap.map = fromRootFilesMapData
    return fromRootFilesMap
  }

  toDirectoriesRelativePath(
    filesMap: FilesMap,
    objectsDirectories: ObjectsDirectories
  ): FilesMap {
    const { pagesDirectory, databasesDirectory, imagesDirectory } =
      objectsDirectories
    const { page, database, image } = filesMap.getAll()

    const toDirectoriesFilesMapData: FilesMapData = {
      page: withoutPathPrefix(page, pagesDirectory),
      database: withoutPathPrefix(database, databasesDirectory),
      image: withoutPathPrefix(image, imagesDirectory),
    }
    const toDirectoriesFilesMap = new FilesMap()
    toDirectoriesFilesMap.map = toDirectoriesFilesMapData
    return toDirectoriesFilesMap
  }
}

function withPathPrefix(
  recordMap: Record<string, FileRecord>,
  prefix: string
): Record<string, FileRecord> {
  return Object.fromEntries(
    Object.entries(recordMap).map(
      ([id, record]: [string, FileRecord]): [string, FileRecord] => [
        id,
        {
          ...record,
          path: path.join(prefix, record.path),
        },
      ]
    )
  )
}

function withoutPathPrefix(
  recordMap: Record<string, FileRecord>,
  prefix: string
): Record<string, FileRecord> {
  return Object.fromEntries(
    Object.entries(recordMap).map(
      ([id, record]: [string, FileRecord]): [string, FileRecord] => [
        id,
        {
          ...record,
          path: record.path.replace(prefix, ""),
        },
      ]
    )
  )
}

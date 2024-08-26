export type FileRecord = {
  path: string
  lastEditedTime: string
}

type FileType = "page" | "database" | "image"

export class FilesMap {
  private map: Record<FileType, Record<string, FileRecord>> = {
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

  // Additional methods can be added as needed
}

export type FileRecord = {
  path: string
  lastEditedTime: string
}

export type AssetType = "image" | "file" | "video" | "pdf" | "audio"
export type FileRecordType = "page" | "database" | AssetType

export type FilesMapData = Record<FileRecordType, Record<string, FileRecord>>

export class FilesMap {
  private map: FilesMapData = {
    page: {},
    database: {},
    image: {},
    file: {},
    video: {},
    pdf: {},
    audio: {},
  }

  exists(type: FileRecordType, id: string): boolean {
    return !!this.map[type][id]
  }

  get(type: FileRecordType, id: string): FileRecord {
    // If the record is not found, throw an error
    const record = this.map[type][id]
    if (!record) {
      throw new Error(`File record not found for ${type} ${id}`)
    }
    return record
  }

  set(type: FileRecordType, id: string, record: FileRecord): void {
    this.map[type][id] = record
  }

  delete(type: FileRecordType, id: string): void {
    delete this.map[type][id]
  }

  getAllOfType(type: FileRecordType): Record<string, FileRecord> {
    return this.map[type]
  }

  getAll(): FilesMapData {
    return this.map
  }

  static fromJSON(json: string): FilesMap {
    const map = new FilesMap()
    const parsed = JSON.parse(json)
    map.map = parsed
    return map
  }

  toJSON(): string {
    return JSON.stringify(this.map, null, 2)
  }
}

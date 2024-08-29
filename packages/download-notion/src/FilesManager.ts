import {
  FileRecord,
  FileType,
  FilesMap,
  FilesMapData,
  ObjectsDirectories,
  recordMapWithPathPrefix,
} from "./FilesMap"
import { NotionObject } from "./NotionObject"

export class FilesManager {
  // This class holds directories in which each file is located and relative paths to them
  public filesMap: FilesMap // Relative paths to files directories
  protected objectsDirectories: ObjectsDirectories // Files directories

  public constructor({
    objectsDirectories,
    initialFilesMap,
  }: {
    objectsDirectories: ObjectsDirectories
    initialFilesMap?: FilesMap
  }) {
    this.filesMap = initialFilesMap || new FilesMap()
    // TODO: If directories changed, cleanup all files in directories changed here
    this.objectsDirectories = objectsDirectories
  }

  // TODO: Rethink if this method should be in this class. FilesManager shouldn't know about processing. Maybe name isNewObject.
  public shouldProcessObject(notionObject: NotionObject): boolean {
    if (
      !this.filesMap.exists(
        // TODO: Make this FilesMa structure more generic when we want to store more than images
        notionObject.object == "block" ? "image" : notionObject.object,
        notionObject.id
      )
    ) {
      return true // Process new pages
    }
    const existingRecord = this.filesMap.get(
      notionObject.object == "block" ? "image" : notionObject.object,
      notionObject.id
    )
    // If new file date is older than old file date, the state is inconcistent and we throw an error
    if (
      new Date(notionObject.lastEditedTime).getTime() >
      new Date(existingRecord.lastEditedTime).getTime()
    ) {
      return true
    }

    return false
  }

  public exists(type: FileType, id: string): boolean {
    return this.filesMap.exists(type, id)
  }

  public get(
    relativeTo: "directory" | "root",
    type: FileType,
    id: string
  ): FileRecord {
    const recordFromDirectory = this.filesMap.get(type, id)

    if (relativeTo === "root") {
      return this.filesMap.recordToRootRelativePath(
        recordFromDirectory,
        this.objectsDirectories[type]
      )
    } else {
      return recordFromDirectory
    }
  }

  public set(
    relativeTo: "directory" | "root",
    type: FileType,
    id: string,
    record: FileRecord
  ): void {
    const recordToSet =
      relativeTo === "root"
        ? this.filesMap.recordToDirectoriesRelativePath(
            record,
            this.objectsDirectories[type]
          )
        : record
    this.filesMap.set(type, id, recordToSet)
  }

  public delete(type: FileType, id: string): void {
    this.filesMap.delete(type, id)
  }

  public getAllOfType(
    relativeTo: "directory" | "root",
    type: FileType
  ): Record<string, FileRecord> {
    const records = this.filesMap.getAllOfType(type)
    if (relativeTo === "root") {
      return recordMapWithPathPrefix(records, this.objectsDirectories[type])
    } else {
      return records
    }
  }

  public getAll(relativeTo: "directory" | "root"): FilesMapData {
    const filesMapData = this.filesMap.getAll()

    if (relativeTo === "root") {
      return {
        page: recordMapWithPathPrefix(
          filesMapData.page,
          this.objectsDirectories.page
        ),
        database: recordMapWithPathPrefix(
          filesMapData.database,
          this.objectsDirectories.database
        ),
        image: recordMapWithPathPrefix(
          filesMapData.image,
          this.objectsDirectories.image
        ),
      }
    } else {
      return filesMapData
    }
  }
}

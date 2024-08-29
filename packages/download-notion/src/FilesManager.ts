import {
  FileRecord,
  FileType,
  FilesMap,
  FilesMapData,
  ObjectPrefixDict,
  recordMapWithPathPrefix,
} from "./FilesMap"
import { NotionObject } from "./NotionObject"

type PathType = "base" | "output" | "markdown"

export class FilesManager {
  // This class holds directories in which each file is located and relative paths to them
  public filesMap: FilesMap // Relative paths to files directories
  protected outputDirectories: ObjectPrefixDict // Files directories
  protected markdownPrefixes: ObjectPrefixDict // Markdown prefixes

  public constructor({
    outputDirectories,
    initialFilesMap,
    markdownPrefixes,
  }: {
    outputDirectories: ObjectPrefixDict
    markdownPrefixes?: ObjectPrefixDict
    initialFilesMap?: FilesMap
  }) {
    this.filesMap = initialFilesMap || new FilesMap()
    // TODO: If directories changed, cleanup all files in directories changed here
    this.outputDirectories = outputDirectories
    this.markdownPrefixes = {
      page: markdownPrefixes?.page || "",
      database: markdownPrefixes?.database || "",
      image: markdownPrefixes?.image || "",
    }
  }

  public isObjectNew(notionObject: NotionObject): boolean {
    if (
      !this.filesMap.exists(
        // TODO: Make this FilesMap structure more generic when we want to store more than images
        notionObject.object == "block" ? "image" : notionObject.object,
        notionObject.id
      )
    ) {
      return true
    }
    const existingRecord = this.filesMap.get(
      notionObject.object == "block" ? "image" : notionObject.object,
      notionObject.id
    )
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

  public get(relativeTo: PathType, type: FileType, id: string): FileRecord {
    const recordFromDirectory = this.filesMap.get(type, id)

    if (relativeTo === "output") {
      return this.filesMap.recordToRootRelativePath(
        recordFromDirectory,
        this.outputDirectories[type]
      )
    } else {
      return recordFromDirectory
    }
  }

  public set(
    relativeTo: PathType,
    type: FileType,
    id: string,
    record: FileRecord
  ): void {
    const recordToSet =
      relativeTo === "output"
        ? this.filesMap.recordToDirectoriesRelativePath(
            record,
            this.outputDirectories[type]
          )
        : record
    this.filesMap.set(type, id, recordToSet)
  }

  public delete(type: FileType, id: string): void {
    this.filesMap.delete(type, id)
  }

  public getAllOfType(
    relativeTo: PathType,
    type: FileType
  ): Record<string, FileRecord> {
    const records = this.filesMap.getAllOfType(type)
    if (relativeTo === "output") {
      return recordMapWithPathPrefix(records, this.outputDirectories[type])
    } else {
      return records
    }
  }

  public getAll(relativeTo: PathType): FilesMapData {
    const filesMapData = this.filesMap.getAll()

    if (relativeTo === "output") {
      return {
        page: recordMapWithPathPrefix(
          filesMapData.page,
          this.outputDirectories.page
        ),
        database: recordMapWithPathPrefix(
          filesMapData.database,
          this.outputDirectories.database
        ),
        image: recordMapWithPathPrefix(
          filesMapData.image,
          this.outputDirectories.image
        ),
      }
    } else {
      return filesMapData
    }
  }
}

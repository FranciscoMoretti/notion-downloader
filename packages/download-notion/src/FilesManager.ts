import {
  FileRecord,
  FileType,
  FilesMap,
  FilesMapData,
  ObjectPrefixDict,
} from "./FilesMap"
import { NotionObject } from "./NotionObject"
import {
  recordMapWithPrefix,
  recordWithPrefix,
  toMapDataWithPrefix,
} from "./recordPrefixUtils"

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

  public get(pathType: PathType, type: FileType, id: string): FileRecord {
    const recordFromDirectory = this.filesMap.get(type, id)

    if (pathType === "output") {
      return recordWithPrefix(recordFromDirectory, this.outputDirectories[type])
    } else if (pathType === "markdown") {
      return recordWithPrefix(recordFromDirectory, this.markdownPrefixes[type])
    } else if (pathType === "base") {
      return recordFromDirectory
    } else {
      // error out
      throw new Error(`Invalid path type: ${pathType}`)
    }
  }

  public set(
    pathType: PathType,
    type: FileType,
    id: string,
    record: FileRecord
  ): void {
    let recordToSet: FileRecord
    if (pathType === "output") {
      recordToSet = recordWithPrefix(record, this.outputDirectories[type])
    } else if (pathType === "markdown") {
      recordToSet = recordWithPrefix(record, this.markdownPrefixes[type])
    } else if (pathType === "base") {
      recordToSet = record
    } else {
      // error out
      throw new Error(`Invalid path type: ${pathType}`)
    }
    this.filesMap.set(type, id, recordToSet)
  }

  public delete(type: FileType, id: string): void {
    this.filesMap.delete(type, id)
  }

  public getAllOfType(
    pathType: PathType,
    type: FileType
  ): Record<string, FileRecord> {
    const records = this.filesMap.getAllOfType(type)
    if (pathType === "output") {
      return recordMapWithPrefix(records, this.outputDirectories[type])
    } else if (pathType === "markdown") {
      return recordMapWithPrefix(records, this.markdownPrefixes[type])
    } else if (pathType === "base") {
      return records
    } else {
      // error out
      throw new Error(`Invalid path type: ${pathType}`)
    }
  }

  public getAll(pathType: PathType): FilesMapData {
    const filesMapData = this.filesMap.getAll()

    if (pathType === "output" || pathType === "markdown") {
      const prefixes =
        pathType === "output" ? this.outputDirectories : this.markdownPrefixes
      return toMapDataWithPrefix(filesMapData, prefixes)
    } else if (pathType === "base") {
      return filesMapData
    } else {
      // error out
      throw new Error(`Invalid path type: ${pathType}`)
    }
  }
}

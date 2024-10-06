import { ObjectType, ObjectType } from "notion-cache-client"

import { FilepathGroup, mapToAssetType } from "../config/schema"
import { NotionObject } from "../notionObjects/NotionObject"
import { iNotionAssetObject } from "../notionObjects/objectTypes"
import { FileRecord, FileRecordType, FilesMap, FilesMapData } from "./FilesMap"
import {
  recordMapWithPrefix,
  recordWithPrefix,
  toMapDataWithPrefix,
} from "./recordPrefixUtils"

type PathType = "base" | "output" | "markdown"

export class FilesManager {
  // This class holds directories in which each file is located and relative paths to them
  protected baseFilesMap: FilesMap // Relative paths to files directories
  protected outputDirectories: FilepathGroup // Files directories
  protected markdownPrefixes: FilepathGroup // Markdown prefixes

  public constructor({
    outputDirectories,
    initialFilesMap,
    markdownPrefixes,
  }: {
    outputDirectories: FilepathGroup
    markdownPrefixes: FilepathGroup
    initialFilesMap?: FilesMap
  }) {
    this.baseFilesMap = initialFilesMap || new FilesMap()
    this.outputDirectories = outputDirectories
    this.markdownPrefixes = markdownPrefixes
  }

  public isObjectNew(notionObject: iNotionAssetObject | NotionObject): boolean {
    const recordType = this._getRecordType(notionObject)
    if (!this.baseFilesMap.exists(recordType, notionObject.id)) {
      return true
    }
    const existingRecord = this.baseFilesMap.get(recordType, notionObject.id)
    if (
      new Date(notionObject.lastEditedTime).getTime() >
      new Date(existingRecord.lastEditedTime).getTime()
    ) {
      return true
    }

    return false
  }

  private _getRecordType(
    notionObject: iNotionAssetObject | NotionObject
  ): FileRecordType {
    const recordType =
      "assetType" in notionObject
        ? mapToAssetType(notionObject.assetType)
        : ObjectType.parse(notionObject.object)
    if (recordType === ObjectType.enum.block) {
      throw new Error("Only block recrods that are assets are supported")
    }
    return recordType
  }

  public exists(type: FileRecordType, id: string): boolean {
    return this.baseFilesMap.exists(type, id)
  }

  public get(pathType: PathType, type: FileRecordType, id: string): FileRecord {
    const recordFromDirectory = this.baseFilesMap.get(type, id)

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
    type: FileRecordType,
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
    this.baseFilesMap.set(type, id, recordToSet)
  }

  public delete(type: FileRecordType, id: string): void {
    this.baseFilesMap.delete(type, id)
  }

  public getAllOfType(
    pathType: PathType,
    type: FileRecordType
  ): Record<FileRecordType, FileRecord> {
    const records = this.baseFilesMap.getAllOfType(type)
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
    const filesMapData = this.baseFilesMap.getAll()

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

  public toJSON(): string {
    return JSON.stringify(
      {
        baseFilesMap: this.baseFilesMap.getAll(),
        outputDirectories: this.outputDirectories,
        markdownPrefixes: this.markdownPrefixes,
      },
      null,
      2
    )
  }

  public static fromJSON(json: string): FilesManager {
    const parsed = JSON.parse(json)
    return new FilesManager({
      outputDirectories: parsed.outputDirectories,
      markdownPrefixes: parsed.markdownPrefixes,
      initialFilesMap: FilesMap.fromJSON(
        JSON.stringify(parsed.baseFilesMap, null, 2)
      ),
    })
  }

  public getOutputDirectories(): FilepathGroup {
    return { ...this.outputDirectories }
  }

  public reset(): void {
    this.baseFilesMap = new FilesMap()
  }
}

export function copyRecord(
  fromManager: FilesManager,
  toManager: FilesManager,
  recordType: FileRecordType,
  recordId: string
) {
  const record = fromManager.get("base", recordType, recordId)
  toManager.set("base", recordType, recordId, record)
}

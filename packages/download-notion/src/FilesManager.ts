import fs from "fs-extra"

import { FileRecord, FileType, FilesMap, ObjectsDirectories } from "./FilesMap"
import { NotionObject } from "./NotionObject"
import { info, verbose } from "./log"

type ExtendedFileRecord = FileRecord & {
  id: string
}

export class FilesManager {
  public filesMap: FilesMap
  protected objectsDirectories: ObjectsDirectories

  public constructor(
    // TODO: Should be structured props and intirialsFilesMap should be optional
    initialFilesMap: FilesMap | undefined,
    objectsDirectories: ObjectsDirectories
  ) {
    this.filesMap = initialFilesMap || new FilesMap()
    // TODO: If directories changed, cleanup all files in directories changed here
    this.objectsDirectories = objectsDirectories
  }

  public async cleanOldFiles(newFilesMap: FilesMap): Promise<void> {
    if (!this.filesMap) {
      info("No files map found, skipping cleanup")
      return
    }
    info("Cleaning up old files")

    const oldFiles = this.getFileRecords(this.filesMap, "page")
    const newFiles = this.getFileRecords(newFilesMap, "page")
    const oldImages = this.getFileRecords(this.filesMap, "image")
    const newImages = this.getFileRecords(newFilesMap, "image")

    const filesToRemove = this.getFilesToRemove(oldFiles, newFiles)
    const imagesToRemove = this.getFilesToRemove(oldImages, newImages)

    const filesCleaner = new FilesCleaner()
    await filesCleaner.cleanupOldFiles([...filesToRemove, ...imagesToRemove])
  }

  private getFileRecords(
    filesMap: FilesMap,
    type: "page" | "image"
  ): ExtendedFileRecord[] {
    return Object.entries(filesMap.getAllOfType(type)).map(([id, record]) => ({
      id,
      ...record,
    }))
  }

  private getFilesToRemove(
    oldRecords: ExtendedFileRecord[],
    newRecords: ExtendedFileRecord[]
  ): string[] {
    const newRecordsMap = new Map(newRecords.map((r) => [r.id, r]))
    const filesToRemove: string[] = []

    for (const oldRecord of oldRecords) {
      const newRecord = newRecordsMap.get(oldRecord.id)
      const reason = this.getRemoveReason(oldRecord, newRecord)

      if (reason) {
        filesToRemove.push(oldRecord.path)
        verbose(
          `Marking file for removal: ${oldRecord.path} id: ${oldRecord.id} (Reason: ${reason})`
        )
      }
    }

    return filesToRemove
  }

  private getRemoveReason(
    oldRecord: FileRecord,
    newRecord: FileRecord | undefined
  ): string | null {
    if (!newRecord) {
      return "no longer exists"
    }

    if (newRecord.path !== oldRecord.path) {
      return "moved"
    }

    // If records were updated,it should not be removed
    if (
      new Date(newRecord.lastEditedTime) >= new Date(oldRecord.lastEditedTime)
    ) {
      return null
    }

    // If new file date is older than old file date, the state is inconcistent and we throw an error
    if (
      new Date(newRecord.lastEditedTime) < new Date(oldRecord.lastEditedTime)
    ) {
      throw new Error("File is not stale")
    }

    // We should never get here
    throw new Error("get removal reason failed")
  }

  public shouldProcessObject(notionObject: NotionObject): boolean {
    if (!this.filesMap) {
      return true // Process all pages if there's no initial files map
    }

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
      new Date(notionObject.lastEditedTime) >
      new Date(existingRecord.lastEditedTime)
    ) {
      return true
    }

    return false
  }

  public get(
    relativeTo: "directory" | "root",
    type: FileType,
    id: string
  ): FileRecord {
    if (!this.filesMap) {
      throw new Error(
        "Trying to get file record from files map that does not exist"
      )
    }

    const recordFromRoot = this.filesMap.get(type, id)

    if (relativeTo === "directory") {
      return this.filesMap.recordToDirectoriesRelativePath(
        recordFromRoot,
        this.objectsDirectories[type]
      )
    } else {
      return recordFromRoot
    }
  }
}

class FilesCleaner {
  public async cleanupOldFiles(filesToRemove: string[]): Promise<void> {
    for (const p of filesToRemove) {
      verbose(`Removing file: ${p}`)
      await fs.rm(p)
    }
  }
}

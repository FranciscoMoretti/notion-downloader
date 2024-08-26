import fs from "fs-extra"

import { FileRecord, FilesMap } from "./FilesMap"
import { info, verbose } from "./log"

type ExtendedFileRecord = FileRecord & {
  id: string
}

export class FilesManager {
  protected filesMap?: FilesMap

  public constructor(initialFilesMap: FilesMap | undefined) {
    this.filesMap = initialFilesMap
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
}

class FilesCleaner {
  public async cleanupOldFiles(filesToRemove: string[]): Promise<void> {
    for (const p of filesToRemove) {
      verbose(`Removing file: ${p}`)
      await fs.rm(p)
    }
  }
}

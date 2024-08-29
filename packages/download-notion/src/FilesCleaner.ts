import fs from "fs-extra"

import { FilesManager } from "./FilesManager"
import { FileRecord } from "./FilesMap"
import { info, verbose } from "./log"

export type ExtendedFileRecord = FileRecord & {
  id: string
}
export class FilesCleaner {
  private oldFilesManager: FilesManager
  private newFilesManager: FilesManager

  constructor({
    oldFilesManager,
    newFilesManager,
  }: {
    oldFilesManager: FilesManager
    newFilesManager: FilesManager
  }) {
    this.oldFilesManager = oldFilesManager
    this.newFilesManager = newFilesManager
  }

  public async cleanupOldFiles(): Promise<void> {
    info("Cleaning up old files")
    const oldFiles = this.getFileRecords(this.oldFilesManager, "page")
    const newFiles = this.getFileRecords(this.newFilesManager, "page")
    const oldImages = this.getFileRecords(this.oldFilesManager, "image")
    const newImages = this.getFileRecords(this.newFilesManager, "image")

    const filesToRemove = this.getFilesToRemove(oldFiles, newFiles)
    const imagesToRemove = this.getFilesToRemove(oldImages, newImages)

    for (const p of [...filesToRemove, ...imagesToRemove]) {
      verbose(`Removing file: ${p}`)
      await fs.rm(p)
    }
  }

  private getFileRecords(
    filesManager: FilesManager,
    type: "page" | "image"
  ): ExtendedFileRecord[] {
    // Root path is needed so that fiels can be removed
    return Object.entries(filesManager.getAllOfType("root", type)).map(
      ([id, record]) => ({
        id,
        ...record,
      })
    )
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

    // If records were updated, it should not be removed
    if (
      new Date(newRecord.lastEditedTime).getTime() >=
      new Date(oldRecord.lastEditedTime).getTime()
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

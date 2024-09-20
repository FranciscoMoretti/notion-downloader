import path from "path"
import fs from "fs-extra"
import { ObjectType } from "notion-cache-client"

import { AssetType } from "../config/schema"
import { info, verbose } from "../log"
import { FilesManager } from "./FilesManager"
import { FileRecord, FileRecordType, allRecordTypes } from "./FilesMap"

export type ExtendedFileRecord = FileRecord & {
  id: string
}

export class FilesCleaner {
  public async cleanupOldFiles(
    oldFilesManager: FilesManager,
    newFilesManager: FilesManager
  ): Promise<void> {
    info("Cleaning up old files")

    const recordsToRemove = allRecordTypes.flatMap((type) => {
      const oldRecords = this.getFileRecords(oldFilesManager, type)
      const newRecords = this.getFileRecords(newFilesManager, type)
      return this.getRecordsToRemove(oldRecords, newRecords)
    })

    await this.removeRecords(recordsToRemove)
  }

  public async cleanupAllFiles(filesManager: FilesManager): Promise<void> {
    info("Cleaning up all tracked files")
    const allFiles = allRecordTypes
      .filter((type) => type !== ObjectType.Database)
      .flatMap((type) => this.getFileRecords(filesManager, type))

    await this.removeRecords(allFiles)
  }

  private async removeRecords(records: ExtendedFileRecord[]): Promise<void> {
    info(`Removing ${records.length} files`)
    for (const record of records) {
      verbose(`Removing file: ${record.path} (ID: ${record.id})`)
      await this.removeFile(record.path)
    }
  }

  private async removeFile(filePath: string): Promise<void> {
    try {
      await fs.remove(filePath)
    } catch (error) {
      console.error(`Error removing file ${filePath}:`, error)
    }
  }

  private getFileRecords(
    filesManager: FilesManager,
    type: FileRecordType
  ): ExtendedFileRecord[] {
    return Object.entries(filesManager.getAllOfType("output", type)).map(
      ([id, record]) => ({
        id,
        ...record,
      })
    )
  }

  private getRecordsToRemove(
    oldRecords: ExtendedFileRecord[],
    newRecords: ExtendedFileRecord[]
  ): ExtendedFileRecord[] {
    const newRecordsMap = new Map(newRecords.map((r) => [r.id, r]))
    return oldRecords.filter((oldRecord) => {
      const newRecord = newRecordsMap.get(oldRecord.id)
      const reason = this.getRemoveReason(oldRecord, newRecord)
      if (reason) {
        verbose(
          `Marking file for removal: ${oldRecord.path} id: ${oldRecord.id} (Reason: ${reason})`
        )
        return true
      }
      return false
    })
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

export async function cleanupOldsFiles(
  existingFilesManager: FilesManager,
  newFilesManager: FilesManager
) {
  const filesCleaner = new FilesCleaner()
  await filesCleaner.cleanupOldFiles(existingFilesManager, newFilesManager)
}

import fs from "fs-extra"

import { FilesMap } from "./FilesMap"
import { info, verbose } from "./log"

export class FilesManager {
  protected rootDirectory = ""
  protected filesMap?: FilesMap
  protected starterFiles: string[] = []

  public constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
    this.filesMap = this.loadFilesMapFile(rootDirectory + "/files_map.json")
  }

  public async cleanOldFiles(newFilesMap: FilesMap): Promise<void> {
    if (!this.filesMap) {
      info("No files map found, skipping cleanup")
      return
    }

    const oldFiles = Object.values(this.filesMap.getAllOfType("page")).map(
      (record) => this.rootDirectory + record.path
    )
    const newFiles = Object.values(newFilesMap.getAllOfType("page")).map(
      (record) => this.rootDirectory + record.path
    )
    const filesCleaner = new FilesCleaner()
    await filesCleaner.cleanupOldFiles(oldFiles, newFiles)
  }

  private loadFilesMapFile(filePath: string): FilesMap | undefined {
    if (fs.existsSync(filePath)) {
      const jsonData = fs.readFileSync(filePath, "utf8")
      return FilesMap.fromJson(jsonData)
    }
    return undefined
  }
}

class FilesCleaner {
  public async cleanupOldFiles(
    starterFiles: string[],
    newFiles: string[]
  ): Promise<void> {
    const sortedStarterFiles = [...starterFiles].sort()
    const newFilesSet = new Set(newFiles)

    const staleFiles = sortedStarterFiles.filter((p) => !newFilesSet.has(p))

    for (const p of staleFiles) {
      verbose(`Removing file: ${p}`)
      await fs.rm(p)
    }
  }
}

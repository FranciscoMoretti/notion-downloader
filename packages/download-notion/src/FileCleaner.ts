import fs from "fs-extra"

import { FilesMap } from "./FilesMap"
import { verbose } from "./log"

export class FileCleaner {
  // TODO: Do everything with a FilesMap interface directly
  // Reads previous files and keeps tracks of them
  // Has methods to cleanup old files

  protected rootDirectory = ""
  protected filesMap?: FilesMap
  protected starterFiles: string[] = []

  public constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
    this.filesMap = this.loadFilesMapFile(rootDirectory + "/files_map.json")
    this.starterFiles = this.filesMap
      ? Object.values(this.filesMap.page)
      : this.getListOfExistingFiles(rootDirectory)
  }

  private loadFilesMapFile(filePath: string): FilesMap | undefined {
    if (fs.existsSync(filePath)) {
      const jsonData = fs.readFileSync(filePath, "utf8")
      return JSON.parse(jsonData)
    }
    return undefined
  }

  public async cleanupOldFiles(whitelistedFiles: string[]): Promise<void> {
    // Remove any pre-existing files that aren't around anymore; this indicates that they were removed or renamed in Notion.
    const staleFiles = this.starterFiles.filter(
      (p) => !whitelistedFiles.includes(p)
    )

    for (const p of staleFiles) {
      verbose(`Removing old doc: ${p}`)
      await fs.rm(p)
    }
  }

  protected getListOfExistingFiles(dir: string): string[] {
    return fs.readdirSync(dir).flatMap((item) => {
      const path = `${dir}/${item}`
      if (fs.statSync(path).isDirectory()) {
        return this.getListOfExistingFiles(path)
      }
      if (path.endsWith(".md")) {
        // we could just notice all files, and maybe that's better. But then we lose an debugging files like .json of the raw notion, on the second run.
        return [path]
      } else return []
    })
  }
}

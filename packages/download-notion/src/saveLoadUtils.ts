import fs from "fs-extra"

import { FilesManager } from "./FilesManager"
import { FilesMap } from "./FilesMap"

export function loadFilesManagerFile(
  filePath: string
): FilesManager | undefined {
  if (fs.existsSync(filePath)) {
    const jsonData = fs.readFileSync(filePath, "utf8")
    return FilesManager.fromJSON(jsonData)
  }
  return undefined
}

export function loadImagesCacheFilesMap(
  filePath: string
): FilesMap | undefined {
  if (fs.existsSync(filePath)) {
    const jsonData = fs.readFileSync(filePath, "utf8")
    return FilesMap.fromJSON(jsonData)
  }
  return undefined
}

export async function saveDataToJson(
  data: any,
  filePath: string
): Promise<void> {
  await fs.writeJson(filePath, data, { spaces: 2 })
}

export async function saveToFile(
  data: string,
  filePath: string
): Promise<void> {
  await fs.writeFile(filePath, data, "utf8")
}

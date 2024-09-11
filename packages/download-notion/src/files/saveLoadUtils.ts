import path from "path"
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

export function loadassetsCacheFilesMap(
  filePath: string
): FilesMap | undefined {
  if (fs.existsSync(filePath)) {
    const jsonData = fs.readFileSync(filePath, "utf8")
    return FilesMap.fromJSON(jsonData)
  }
  return undefined
}

// TODO: Centralize JSON conversion
export async function saveObjectToJson(
  data: any,
  filePath: string
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath))
  await fs.writeJson(filePath, data, {
    encoding: "utf8",
    spaces: 2,
  })
}

export async function saveDataToFile(
  data: string,
  filePath: string
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, data, "utf8")
}

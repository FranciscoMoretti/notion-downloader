import crypto from "crypto"
import * as Path from "path"
import fs from "fs-extra"

import { FilesMap } from "./FilesMap"
import { NotionImage } from "./NotionImage"
import { PlainObjectsMap, getPageAncestorId } from "./objects_utils"

export function convertToUUID(str: string): string {
  if (str.length !== 32) {
    throw new Error("Input string must be 32 characters long")
  }
  return `${str.slice(0, 8)}-${str.slice(8, 12)}-${str.slice(
    12,
    16
  )}-${str.slice(16, 20)}-${str.slice(20)}`
}
export async function saveDataToJson(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  await fs.writeFile(filename, json)
}
export function findLastUuid(url: string): string | null {
  // Regex for a UUID surrounded by slashes
  const uuidPattern =
    /(?<=\/)[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/)/gi

  // Find all UUIDs
  const uuids = url.match(uuidPattern)
  // Return the last UUID if any exist, else return null
  return uuids ? uuids[uuids.length - 1].trim() : null
}

export function hashOfString(s: string): string {
  let hash = 0
  for (let i = 0; i < s.length; ++i)
    hash = Math.imul(31, hash) + s.charCodeAt(i)

  return Math.abs(hash).toString()
}
export function hashOfBufferContent(buffer: Buffer): string {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex")
  return hash.slice(0, 20)
}

export function filenameFromPath(path: string) {
  const filenameWithoutExtension = Path.basename(path, Path.extname(path))
  return filenameWithoutExtension
}
export function getPageAncestorFilename(
  image: NotionImage,
  objectsMap: PlainObjectsMap,
  filesMap: FilesMap
): string {
  if (image.object == "page") {
    return filesMap.get("page", image.id).path
  }
  const ancestorPageId = getPageAncestorId(image.id, objectsMap)
  if (!ancestorPageId) {
    throw new Error("Ancestor page not found for image " + image.id)
  }
  return filenameFromPath(filesMap.get("page", ancestorPageId).path)
}
export function sanitizeMarkdownOutputPath(path: string) {
  // Remove trailing slashes
  return path.replace(/\/+$/, "")
}

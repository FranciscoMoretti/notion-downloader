import crypto from "crypto"
import * as Path from "path"
import fs from "fs-extra"
import { ObjectType } from "notion-cache-client"
import { NotionObjectTree } from "notion-downloader"

import { FilesManager } from "./files/FilesManager"
import { NotionObject } from "./notionObjects/NotionObject"
import { NotionImageLike } from "./notionObjects/objectTypes"
import { getPageAncestorId } from "./objectTree/objectTreeUtills"

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
function getAncestorPageOrDatabaseFilepath(
  notionObject: NotionObject,
  objectsTree: NotionObjectTree,
  filesManager: FilesManager
): string {
  if (notionObject.object == ObjectType.Page) {
    return filesManager.get("base", ObjectType.Page, notionObject.id).path
  } else if (notionObject.object == ObjectType.Database) {
    return filesManager.get("base", ObjectType.Database, notionObject.id).path
  }

  // It's a block. Ancestor is page
  const ancestorPageId = getPageAncestorId(
    ObjectType.Block,
    notionObject.id,
    objectsTree
  )
  if (!ancestorPageId) {
    throw new Error("Ancestor page not found for object " + notionObject.id)
  }
  return filesManager.get("base", ObjectType.Page, ancestorPageId).path
}

export function getAncestorPageOrDatabaseFilename(
  notionObject: NotionObject,
  objectsTree: NotionObjectTree,
  filesManager: FilesManager
): string {
  return filenameFromPath(
    getAncestorPageOrDatabaseFilepath(notionObject, objectsTree, filesManager)
  )
}

export function sanitizeMarkdownOutputPath(path: string) {
  // Remove trailing slashes
  return path.replace(/\/+$/, "")
}

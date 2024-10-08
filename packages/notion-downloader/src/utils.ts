import crypto from "crypto"
import * as Path from "path"
import fs from "fs-extra"
import { ObjectType } from "notion-cache-client"
import { NotionObjectTree } from "notion-tree"

import { FilesManager } from "./files/FilesManager"
import { NotionObject } from "./notionObjects/NotionObject"

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
  if (notionObject.object == ObjectType.enum.page) {
    return filesManager.get("base", ObjectType.enum.page, notionObject.id).path
  } else if (notionObject.object == ObjectType.enum.database) {
    return filesManager.get("base", ObjectType.enum.database, notionObject.id)
      .path
  }

  // It's a block. Ancestor is page
  const ancestorPageId = getPageAncestorId(
    ObjectType.enum.block,
    notionObject.id,
    objectsTree
  )
  if (!ancestorPageId) {
    throw new Error("Ancestor page not found for object " + notionObject.id)
  }
  return filesManager.get("base", ObjectType.enum.page, ancestorPageId).path
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

export function getPageAncestorId(
  objectType: ObjectType,
  id: string,
  objectTree: NotionObjectTree
) {
  const parent = objectTree.getParent(objectType, id)
  if (!parent) {
    return null
  }
  const parentObject = objectTree.getObject(parent.object, parent.id)
  if (!parentObject) {
    return null
  }

  if (parentObject.object === ObjectType.enum.page) {
    return parentObject.id
  }
  if (parentObject.object === ObjectType.enum.database) {
    return getPageAncestorId(
      ObjectType.enum.database,
      parentObject.id,
      objectTree
    )
  }
  if (parentObject.object === ObjectType.enum.block) {
    return getPageAncestorId(ObjectType.enum.block, parentObject.id, objectTree)
  }
}

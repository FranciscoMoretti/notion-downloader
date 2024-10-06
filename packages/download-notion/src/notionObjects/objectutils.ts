import {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { ObjectType } from "notion-cache-client"
import { NotionObjectResponse } from "notion-tree"

import { AssetType, mapToAssetType } from "../config/schema"
import { NotionBlockImage } from "./NotionBlockImage"
import {
  DatabaseObjectResponseWithCover,
  NotionCoverImage,
  NotionCoverImageResponses,
  PageObjectResponseWithCover,
} from "./NotionCoverImage"
import { FileCoreObject } from "./NotionFile"
import {
  NotionFileObject,
  NotionFileObjectResponses,
  getFileFromObjectResponse,
} from "./NotionFileObject"
import { NotionImageLike, iNotionAssetObject } from "./objectTypes"

function hasImageLikeObject(notionObject: NotionObjectResponse) {
  if (
    notionObject.object === ObjectType.enum.block &&
    notionObject.type === "image"
  ) {
    return true
  }
  if (notionObject.object === ObjectType.enum.page && notionObject.cover) {
    return true
  }
  if (notionObject.object === ObjectType.enum.database && notionObject.cover) {
    return true
  }

  return false
}

export function notionObjectHasExternalFile(
  notionObject: NotionObjectResponse
) {
  if (
    notionObject.object === ObjectType.enum.block &&
    AssetType.options.includes(notionObject.type as AssetType)
  ) {
    const file = getFileFromObjectResponse(
      notionObject as NotionFileObjectResponses
    )
    return file && isExternalFile(file)
  }
  if (notionObject.object === ObjectType.enum.page && notionObject.cover) {
    return isExternalFile(notionObject.cover)
  }
  if (notionObject.object === ObjectType.enum.database && notionObject.cover) {
    return isExternalFile(notionObject.cover)
  }
  return false
}

export function isExternalFile(notionFile: FileCoreObject) {
  return notionFile.type === "external"
}

export function getAssetTypeFromObjectResponse(
  notionObject: NotionObjectResponse
): AssetType | undefined {
  if (notionObjectHasExternalFile(notionObject)) {
    return undefined
  }

  if (hasImageLikeObject(notionObject)) {
    return mapToAssetType("image")
  }
  if (
    notionObject.object === ObjectType.enum.block &&
    notionObject.type === "video"
  ) {
    return mapToAssetType("video")
  }
  if (
    notionObject.object === ObjectType.enum.block &&
    notionObject.type === "file"
  ) {
    return mapToAssetType("file")
  }
  if (
    notionObject.object === ObjectType.enum.block &&
    notionObject.type === "pdf"
  ) {
    return mapToAssetType("pdf")
  }
  if (
    notionObject.object === ObjectType.enum.block &&
    notionObject.type === "audio"
  ) {
    return mapToAssetType("audio")
  }
  return undefined
}

export type NotionAssetObjectResponses =
  | NotionCoverImageResponses
  | NotionFileObjectResponses

export function getAssetObjectFromObjectResponse(
  notionObject: NotionAssetObjectResponses
): iNotionAssetObject {
  const assetType = getAssetTypeFromObjectResponse(notionObject)
  if (assetType == AssetType.enum.image) {
    return getImageLikeObject(notionObject)
  } else if (assetType) {
    return new NotionFileObject(notionObject as NotionFileObjectResponses)
  }

  throw new Error(`No asset object found for ${notionObject}`)
}

export function getImageLikeObject(
  notionObject: NotionObjectResponse
): NotionImageLike {
  if (
    notionObject.object === ObjectType.enum.block &&
    notionObject.type === "image"
  ) {
    return new NotionBlockImage(notionObject)
  }
  if (notionObject.object === ObjectType.enum.page) {
    if (pageHasCover(notionObject)) {
      return new NotionCoverImage(notionObject)
    }
  }
  if (notionObject.object === ObjectType.enum.database) {
    if (databaseHasCover(notionObject)) {
      return new NotionCoverImage(notionObject)
    }
  }

  throw new Error(`No image like object found for ${notionObject.object}`)
}
export function pageHasCover(
  metadata: PageObjectResponse
): metadata is PageObjectResponseWithCover {
  return Boolean(metadata.cover)
}
export function databaseHasCover(
  metadata: DatabaseObjectResponse
): metadata is DatabaseObjectResponseWithCover {
  return Boolean(metadata.cover)
}

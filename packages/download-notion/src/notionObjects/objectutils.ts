import {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { ObjectType } from "notion-cache-client"
import { NotionObjectResponse } from "notion-downloader"

import { AssetType, mapToAssetType } from "../config/schema"
import { NotionBlockImage } from "./NotionBlockImage"
import {
  DatabaseObjectResponseWithCover,
  NotionCoverImage,
  NotionCoverImageResponses,
  PageObjectResponseWithCover,
} from "./NotionCoverImage"
import { NotionFileObject, NotionFileObjectResponses } from "./NotionFileObject"
import { NotionImageLike, iNotionAssetObject } from "./objectTypes"

export function hasImageLikeObject(notionObject: NotionObjectResponse) {
  if (
    notionObject.object === ObjectType.Block &&
    notionObject.type === "image"
  ) {
    return true
  }
  if (notionObject.object === ObjectType.Page && notionObject.cover) {
    return true
  }
  if (notionObject.object === ObjectType.Database && notionObject.cover) {
    return true
  }

  return false
}

export function getAssetTypeFromObjectResponse(
  notionObject: NotionObjectResponse
): AssetType | undefined {
  if (hasImageLikeObject(notionObject)) {
    return mapToAssetType("image")
  }
  if (
    notionObject.object === ObjectType.Block &&
    notionObject.type === "video"
  ) {
    return mapToAssetType("video")
  }
  if (
    notionObject.object === ObjectType.Block &&
    notionObject.type === "file"
  ) {
    return mapToAssetType("file")
  }
  if (notionObject.object === ObjectType.Block && notionObject.type === "pdf") {
    return mapToAssetType("pdf")
  }
  if (
    notionObject.object === ObjectType.Block &&
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
  if (assetType == AssetType.Image) {
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
    notionObject.object === ObjectType.Block &&
    notionObject.type === "image"
  ) {
    return new NotionBlockImage(notionObject)
  }
  if (notionObject.object === ObjectType.Page) {
    if (pageHasCover(notionObject)) {
      return new NotionCoverImage(notionObject)
    }
  }
  if (notionObject.object === ObjectType.Database) {
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

import {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionObjectResponse } from "notion-downloader"

import { AssetType } from "../files/FilesMap"
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
  if (notionObject.object === "block" && notionObject.type === "image") {
    return true
  }
  if (notionObject.object === "page" && notionObject.cover) {
    return true
  }
  if (notionObject.object === "database" && notionObject.cover) {
    return true
  }

  return false
}

export function getAssetTypeFromObjectResponse(
  notionObject: NotionObjectResponse
): AssetType | undefined {
  if (hasImageLikeObject(notionObject)) {
    return "image"
  }
  if (notionObject.object === "block" && notionObject.type === "video") {
    return "video"
  }
  if (notionObject.object === "block" && notionObject.type === "file") {
    return "file"
  }
  if (notionObject.object === "block" && notionObject.type === "pdf") {
    return "pdf"
  }
  if (notionObject.object === "block" && notionObject.type === "audio") {
    return "audio"
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
  if (assetType == "image") {
    return getImageLikeObject(notionObject)
  } else if (assetType) {
    return new NotionFileObject(notionObject as NotionFileObjectResponses)
  }

  throw new Error(`No asset object found for ${notionObject}`)
}

export function getImageLikeObject(
  notionObject: NotionObjectResponse
): NotionImageLike {
  if (notionObject.object === "block" && notionObject.type === "image") {
    return new NotionBlockImage(notionObject)
  }
  if (notionObject.object === "page") {
    if (pageHasCover(notionObject)) {
      return new NotionCoverImage(notionObject)
    }
  }
  if (notionObject.object === "database") {
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

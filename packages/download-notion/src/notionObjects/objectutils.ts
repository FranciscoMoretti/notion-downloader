import {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { NotionObjectResponse } from "notion-downloader"

import { NotionBlockImage } from "./NotionBlockImage"
import {
  DatabaseObjectResponseWithCover,
  NotionCoverImage,
  PageObjectResponseWithCover,
} from "./NotionCoverImage"
import { NotionImageLike } from "./objectTypes"

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

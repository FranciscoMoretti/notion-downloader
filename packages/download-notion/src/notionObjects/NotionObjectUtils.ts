import { ObjectType } from "notion-cache-client"
import { NotionObjectResponse } from "notion-downloader"

import { NotionBlock } from "./NotionBlock"
import { NotionBlockImage } from "./NotionBlockImage"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"

export function getNotionObject(response: NotionObjectResponse) {
  if (response.object == ObjectType.Page) {
    return new NotionPage(response)
  } else if (response.object == ObjectType.Database) {
    return new NotionDatabase(response)
  } else if (response.object == ObjectType.Block) {
    if (response.type == "image") {
      return new NotionBlockImage(response)
    } else {
      return new NotionBlock(response)
    }
  } else {
    throw new Error(`Unsupported object type for response: ${response}`)
  }
}

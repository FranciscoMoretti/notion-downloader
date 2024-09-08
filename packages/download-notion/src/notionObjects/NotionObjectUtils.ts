import { NotionObjectResponse } from "notion-downloader"

import { NotionBlock } from "./NotionBlock"
import { NotionBlockImage } from "./NotionBlockImage"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"

export function getNotionObject(response: NotionObjectResponse) {
  if (response.object == "page") {
    return new NotionPage(response)
  } else if (response.object == "database") {
    return new NotionDatabase(response)
  } else if (response.object == "block") {
    if (response.type == "image") {
      return new NotionBlockImage(response)
    } else {
      return new NotionBlock(response)
    }
  } else {
    throw new Error(`Unsupported object type for response: ${response}`)
  }
}
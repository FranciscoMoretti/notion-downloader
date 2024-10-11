import { ObjectType } from "notion-cache-client"
import { NotionObjectResponse } from "notion-tree"

import { MarkdownExtension } from "../config/schema"
import { NotionBlock } from "./NotionBlock"
import { NotionBlockImage } from "./NotionBlockImage"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"

export function getNotionObject(
  response: NotionObjectResponse,
  markdownExtension: MarkdownExtension
) {
  if (response.object == ObjectType.enum.page) {
    return new NotionPage(response, markdownExtension)
  } else if (response.object == ObjectType.enum.database) {
    return new NotionDatabase(response)
  } else if (response.object == ObjectType.enum.block) {
    if (response.type == "image") {
      return new NotionBlockImage(response)
    } else {
      return new NotionBlock(response)
    }
  } else {
    throw new Error(`Unsupported object type for response: ${response}`)
  }
}

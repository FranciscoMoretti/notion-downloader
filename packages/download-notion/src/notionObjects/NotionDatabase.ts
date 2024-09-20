import {
  DatabaseObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { ObjectType } from "notion-cache-client"

import { NotionObject } from "./NotionObject"

// Response wrapper access class
export class NotionDatabase implements NotionObject {
  public metadata: DatabaseObjectResponse

  public constructor(metadata: DatabaseObjectResponse) {
    this.metadata = metadata
  }

  public get id() {
    return this.metadata.id
  }

  public get lastEditedTime() {
    return this.metadata.last_edited_time
  }

  public get object() {
    return ObjectType.enum.database
  }

  // In Notion, pages from the Outline have "title"'s.
  public get title(): string {
    return this.richTextItemArrayToPlainText(
      this.metadata.title,
      "title missing"
    )
  }

  // TODO: Move to util
  private richTextItemArrayToPlainText(
    textArray: RichTextItemResponse[],
    defaultIfEmpty: string = ""
  ) {
    //console.log("textarray:" + JSON.stringify(textArray, null, 2));
    return textArray && textArray.length
      ? (textArray
          .map((item: { plain_text: any }) => item.plain_text)
          .join("") as string)
      : defaultIfEmpty
  }
}

import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { ObjectType } from "notion-cache-client"

import { strigifyRichTextResponseArray } from "../properties/toPlainText"
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
    return strigifyRichTextResponseArray(this.metadata.title)
  }
}

import {
  DatabaseObjectResponse,
  ImageBlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

import { NotionFile } from "./NotionFile"
import { NotionObject } from "./NotionObject"

export type PageObjectResponseWithCover = PageObjectResponse & {
  cover: NonNullable<PageObjectResponse["cover"]>
}

export type DatabaseObjectResponseWithCover = DatabaseObjectResponse & {
  cover: NonNullable<DatabaseObjectResponse["cover"]>
}

type NotionBlockImageResponses = ImageBlockObjectResponse

export class NotionBlockImage extends NotionFile implements NotionObject {
  private metadata: NotionBlockImageResponses

  constructor(imageResponse: NotionBlockImageResponses) {
    super(imageResponse.image)
    this.metadata = imageResponse
  }

  get caption(): string | undefined {
    return this.metadata.image.caption.map((c) => c.plain_text).join("") || ""
  }

  get id(): string {
    return this.metadata.id
  }

  get object() {
    return this.metadata.object
  }

  get type() {
    return this.metadata.type
  }

  get lastEditedTime(): string {
    return this.metadata.last_edited_time
  }
}

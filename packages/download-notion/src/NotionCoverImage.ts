import {
  DatabaseObjectResponse,
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

type NotionCoverImageResponses =
  | PageObjectResponseWithCover
  | DatabaseObjectResponseWithCover

export class NotionCoverImage extends NotionFile implements NotionObject {
  private metadata: NotionCoverImageResponses

  constructor(imageResponse: NotionCoverImageResponses) {
    super(imageResponse.cover)
    this.metadata = imageResponse
  }

  get id(): string {
    return this.metadata.id
  }

  get object() {
    return this.metadata.object
  }

  get lastEditedTime(): string {
    return this.metadata.last_edited_time
  }
}

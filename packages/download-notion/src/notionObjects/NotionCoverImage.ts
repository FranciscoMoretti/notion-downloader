import {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

import { AssetType, FileType } from "../config/schema"
import { NotionFile } from "./NotionFile"
import { NotionObject } from "./NotionObject"
import { iNotionAssetObject } from "./objectTypes"

export type PageObjectResponseWithCover = PageObjectResponse & {
  cover: NonNullable<PageObjectResponse["cover"]>
}

export type DatabaseObjectResponseWithCover = DatabaseObjectResponse & {
  cover: NonNullable<DatabaseObjectResponse["cover"]>
}

export type NotionCoverImageResponses =
  | PageObjectResponseWithCover
  | DatabaseObjectResponseWithCover

export class NotionCoverImage extends NotionFile implements iNotionAssetObject {
  private metadata: NotionCoverImageResponses
  public assetType: AssetType = AssetType.Image
  public fileType: FileType = AssetType.Image

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

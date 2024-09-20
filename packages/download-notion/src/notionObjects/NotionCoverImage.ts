import {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { ObjectType } from "notion-cache-client"

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
  public assetType: AssetType = AssetType.enum.image
  public fileType: FileType = AssetType.enum.image

  constructor(imageResponse: NotionCoverImageResponses) {
    super(imageResponse.cover)
    this.metadata = imageResponse
  }

  get id(): string {
    return this.metadata.id
  }

  get object(): ObjectType.Page | ObjectType.Database {
    if (this.metadata.object === ObjectType.Page) {
      return ObjectType.Page
    } else if (this.metadata.object === ObjectType.Database) {
      return ObjectType.Database
    }
    throw new Error("Invalid object type")
  }

  get lastEditedTime(): string {
    return this.metadata.last_edited_time
  }
}

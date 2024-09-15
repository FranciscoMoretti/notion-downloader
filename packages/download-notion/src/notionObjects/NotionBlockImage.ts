import {
  DatabaseObjectResponse,
  ImageBlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { ObjectType } from "notion-cache-client"

import { AssetType, FileType } from "../config/schema"
import { NotionFile } from "./NotionFile"
import { iNotionAssetObject } from "./objectTypes"

export type PageObjectResponseWithCover = PageObjectResponse & {
  cover: NonNullable<PageObjectResponse["cover"]>
}

export type DatabaseObjectResponseWithCover = DatabaseObjectResponse & {
  cover: NonNullable<DatabaseObjectResponse["cover"]>
}

type NotionBlockImageResponses = ImageBlockObjectResponse

// TODO: This should inherit from NotionBlock
export class NotionBlockImage extends NotionFile implements iNotionAssetObject {
  private metadata: NotionBlockImageResponses
  public assetType: AssetType = AssetType.Image
  public fileType: FileType = AssetType.Image

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

  get object(): ObjectType.Block {
    return ObjectType.Block
  }

  get type() {
    return this.metadata.type
  }

  get lastEditedTime(): string {
    return this.metadata.last_edited_time
  }
}

import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { ObjectType } from "notion-cache-client"

import { AssetType, FileType } from "../config/schema"
import { error } from "../log"
import { stringifyProperty, stringifyText } from "../properties/toPlainText"
import { NotionObject } from "./NotionObject"

export class NotionPage implements NotionObject {
  // TODO: Can this, Database and Image Extend the PageObjectResponse instead of using as metadata?
  public metadata: PageObjectResponse
  public assetType: AssetType = AssetType.enum.image
  public fileType: FileType = AssetType.enum.image
  public extension: string = "md"

  public constructor(metadata: PageObjectResponse) {
    this.metadata = metadata
  }

  public get id(): string {
    return this.metadata.id
  }

  public get lastEditedTime(): string {
    return this.metadata.last_edited_time
  }

  public get object() {
    return ObjectType.enum.page
  }

  public get isDatabaseChild(): boolean {
    /*
    {
        "object": "page",
        "parent": {
            "type": "page_id",
            or
            "type": "database_id",
            ...
        },
    */
    return this.metadata.parent.type === "database_id"
  }

  public get title(): string {
    // Databases child pages can change the name for the title property
    const titlePropertyKey = this.isDatabaseChild
      ? this.getTitlePropertyKey()
      : "title"
    return this.getGenericProperty(titlePropertyKey) || "Title missing"
  }

  private getTitlePropertyKey(): string {
    // It's ensured that there is only one property of type "title".
    const titleProperty = Object.keys(this.metadata.properties).find(
      (key) => this.metadata.properties[key].type === "title"
    )
    if (!titleProperty) {
      throw new Error(
        `No title property found in ${JSON.stringify(this.metadata, null, 2)}`
      )
    }
    return titleProperty
  }

  // TODO: Move these methods into the `toPlainText` file
  public getGenericProperty(propertyName: string): string | undefined {
    const type = (this.metadata as any).properties?.[propertyName]?.type
    if (!type) return undefined
    const property = this.metadata.properties[propertyName]
    return stringifyProperty(property)
  }
}

import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { ObjectType } from "notion-cache-client"

import { FileType, MarkdownExtension, TextType } from "../config/schema"
import { stringifyProperty } from "../properties/toPlainText"
import { PageProperty } from "../properties/types"
import { NotionObject } from "./NotionObject"

export class NotionPage implements NotionObject {
  // TODO: Can this, Database and Image Extend the PageObjectResponse instead of using as metadata?
  public metadata: PageObjectResponse
  public fileType: FileType = TextType.enum.markdown
  // TODO: This object has too many responsibilities. NotionPage should only be for handy access to PageObjectResponse.
  // TODO: File based stuff only matters in some parts of the application, therefore it should be in another class.
  public extension: MarkdownExtension

  public constructor(
    metadata: PageObjectResponse,
    markdownExtension: MarkdownExtension = MarkdownExtension.enum.md
  ) {
    this.metadata = metadata
    this.extension = markdownExtension
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
    return this.getPropertyAsPlainText(titlePropertyKey) || "Title missing"
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

  public getPropertyAsPlainText(propertyName: string): string | undefined {
    const property = this.getProperty(propertyName)
    if (!property) return undefined
    return stringifyProperty(property)
  }

  public getProperty(propertyName: string): PageProperty | undefined {
    const type = (this.metadata as any).properties?.[propertyName]?.type
    if (!type) return undefined
    const property = this.metadata.properties[propertyName]
    return property
  }
}

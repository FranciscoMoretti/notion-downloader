/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Client, isFullPage } from "@notionhq/client"
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { BlockObjectTreeNode, NotionObjectTreeNode } from "notion-downloader"
import { ListBlockChildrenResponseResults } from "notion-to-md/build/types"

import { error } from "../log"
import { parseLinkId } from "../plugins/internalLinks"
import { NotionObject } from "./NotionObject"

export class NotionPage implements NotionObject {
  // TODO: Can this, Database and Image Extend the PageObjectResponse instead of using as metadata?
  public metadata: PageObjectResponse

  public constructor(metadata: PageObjectResponse) {
    this.metadata = metadata
  }

  public get id(): string {
    return this.metadata.id
  }

  public get lastEditedTime(): string {
    return this.metadata.last_edited_time
  }

  public get object(): "page" {
    return this.metadata.object
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
    return this.getPlainTextProperty(titlePropertyKey, "title missing")
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

  public getGenericProperty(property: string): string | undefined {
    const type = (this.metadata as any).properties?.[property]?.type
    if (!type) return undefined
    switch (type) {
      case "text":
      case "rich_text":
      case "title":
        return this.getPlainTextProperty(property, "")
      case "status":
        return this.getStatusProperty(property)
      case "select":
        return this.getSelectProperty(property)
      case "multi_select":
        return this.getMultiSelectProperty(property)
      case "date":
        return this.getDateProperty(property, "")
      case "created_time":
        return this.getCreatedTimeProperty(property)

      default:
        error(
          `Unknown property type {${type}} in ${JSON.stringify(
            this.metadata,
            null,
            2
          )}. Handling for this property type was not implemented. Please open an issue.`
        )
        return undefined
    }
  }

  public getPlainTextProperty(
    property: string,
    defaultIfEmpty: string
  ): string {
    /* Notion strings look like this
   "properties": {
      "slug": {
        "type": "rich_text",
        ...
        "rich_text": [
          {
            ...
            "plain_text": "/",
          }
        ]
      },
       "Name": {
        "type": "title",
        "title": [
          {
            ...
            "plain_text": "Intro",
          },
          {
            ...
            "plain_text": " to Notion",
          }
        ]
      */

    //console.log("metadata:\n" + JSON.stringify(this.metadata, null, 2));
    const p = (this.metadata as any).properties?.[property]

    //console.log(`prop ${property} = ${JSON.stringify(p)}`);
    if (!p) return defaultIfEmpty
    const textArray = p[p.type]
    //console.log("textarray:" + JSON.stringify(textArray, null, 2));
    return textArray && textArray.length
      ? (textArray
          .map((item: { plain_text: any }) => item.plain_text)
          .join("") as string)
      : defaultIfEmpty
  }

  public getStatusProperty(property: string): string | undefined {
    /* Notion select values look like this
     "properties": {
        "Status": {
            id: "jk%3EJ",
            type: "status",
            status: {
              id: "380080e4-a6fd-47e4-8edf-dcbf73ecf066",
              name: "Published",
              color: "green",
            },
          }
        },
        */

    const p = (this.metadata as any).properties?.[property]
    if (!p) {
      throw new Error(
        `missing ${property} in ${JSON.stringify(this.metadata, null, 2)}`
      )
      return undefined
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return p.status?.name || ""
  }

  public getCreatedTimeProperty(property: string) {
    /* Notion dates look like this
    'Created time': {
    id: 'rvNH',
    type: 'created_time',
    created_time: '2024-07-05T11:04:00.000Z'
  },
  */
    const p = (this.metadata as any).properties?.[property]
    if (!p) {
      throw new Error(
        `missing ${property} in ${JSON.stringify(this.metadata, null, 2)}`
      )
      return undefined
    }

    return (this.metadata as any).properties?.[property].created_time
  }

  public getMultiSelectProperty(property: string): string | undefined {
    /* Notion multi_select values look like this
     "properties": {
        "Status": {
          "id": "oB~%3D",
          "type": "select",
          "select": {
            "id": "1",
            "name": "Ready For Review",
            "color": "red"
          }
        },
        */

    const p = (this.metadata as any).properties?.[property]
    if (!p) {
      throw new Error(
        `missing ${property} in ${JSON.stringify(this.metadata, null, 2)}`
      )
      return undefined
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return p.multi_select?.map(({ name }) => name).join(", ") || ""
  }

  public getSelectProperty(property: string): string | undefined {
    /* Notion select values look like this
     "properties": {
        "Status": {
          "id": "oB~%3D",
          "type": "select",
          "select": {
            "id": "1",
            "name": "Ready For Review",
            "color": "red"
          }
        },
        */

    const p = (this.metadata as any).properties?.[property]
    if (!p) {
      throw new Error(
        `missing ${property} in ${JSON.stringify(this.metadata, null, 2)}`
      )
      return undefined
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return p.select?.name || ""
  }

  public getDateProperty(
    property: string,
    defaultIfEmpty: string,
    start = true
  ): string {
    /* Notion dates look like this
   "properties": {
      "published_date":
      {
        "id":"a%3Cql",
        "type":"date",
        "date":{
          "start":"2021-10-24",
          "end":null,
          "time_zone":null
        }
      }
    }
    */

    // console.log("metadata:\n" + JSON.stringify(this.metadata, null, 2));
    const p = (this.metadata as any).properties?.[property]

    // console.log(`prop ${property} = ${JSON.stringify(p)}`);
    if (!p) return defaultIfEmpty
    if (start) {
      return p?.date?.start ? (p.date.start as string) : defaultIfEmpty
    } else {
      return p?.date?.end ? (p.date.end as string) : defaultIfEmpty
    }
  }
}
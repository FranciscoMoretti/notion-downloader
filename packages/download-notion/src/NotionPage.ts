/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Client, isFullPage } from "@notionhq/client"
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { ListBlockChildrenResponseResults } from "notion-to-md/build/types"

import { NotionObject } from "./NotionObject"
import { error } from "./log"
import { parseLinkId } from "./plugins/internalLinks"

type CustomPropertiesConfig = {
  titleProperty: string
  slugProperty: string
}

export type NotionPageConfig = {
  titleProperty?: string
  slugProperty?: string
}

export class NotionPage implements NotionObject {
  public metadata: PageObjectResponse
  public config: CustomPropertiesConfig

  public constructor(metadata: PageObjectResponse, config?: NotionPageConfig) {
    this.metadata = metadata
    this.config = {
      titleProperty: "Name",
      slugProperty: "Slug", // TODO: Eliminate
      ...config,
    }

    // review: this is expensive to learn as it takes another api call... I
    // think? We can tell if it's a database because it has a "Name" instead of a
    // "tile" and "parent": "type": "database_id". But do we need to differentiate
    //this.type = PageType.Unknown;
  }

  public matchesLinkId(id: string): boolean {
    const { baseLinkId } = parseLinkId(id)

    const match =
      baseLinkId === this.id || // from a link_to_page.pageId, which still has the dashes
      baseLinkId === this.id.replaceAll("-", "") // from inline links, which are lacking the dashes

    // logDebug(
    //   `matchedLinkId`,
    //   `comparing pageId:${this.pageId} to id ${id} --> ${match.toString()}`
    // );
    return match
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

  // In Notion, pages from the Database have names and simple pages have titles.
  public get nameOrTitle(): string {
    return this.isDatabaseChild ? this.name : this.title
  }

  // TODO: This responsibility of naming should go to an external class
  public nameForFile(): string {
    // In Notion, pages from the Database have names and simple pages have titles.
    return !this.isDatabaseChild
      ? this.title
      : // if it's a Database page, then we'll use the slug unless there is none, then we'd rather have the
        // page name than an ugly id for the file name
        this.explicitSlug()?.replace(/^\//, "") || this.name
  }

  // TODO: let's go farther in hiding this separate title vs name stuff. This seems like an implementation detail on the Notion side.

  // In Notion, pages from the Outline have "title"'s.
  private get title(): string {
    return this.getPlainTextProperty("title", "title missing")
  }
  // In Notion, pages from the Database have "Name"s.
  private get name(): string {
    // TODO: Notion has to specify which property represents the title somehow. Find how to do it automatically
    return this.getPlainTextProperty(this.config.titleProperty, "name missing")
  }

  public get status(): string | undefined {
    return this.getGenericProperty("Status")
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

export async function getPageContentInfo(
  children: ListBlockChildrenResponseResults
): Promise<{
  childPageIdsAndOrder: { id: string; order: number }[]
  childDatabaseIdsAndOrder: { id: string; order: number }[]
  linksPageIdsAndOrder: { id: string; order: number }[]
  hasParagraphs: boolean
}> {
  for (let i = 0; i < children.length; i++) {
    ;(children[i] as any).order = i
  }
  return {
    childPageIdsAndOrder: children
      .filter((b: any) => b.type === "child_page")
      .map((b: any) => ({ id: b.id, order: b.order })),
    childDatabaseIdsAndOrder: children
      .filter((b: any) => b.type === "child_database")
      .map((b: any) => ({ id: b.id, order: b.order })),
    linksPageIdsAndOrder: children
      .filter((b: any) => b.type === "link_to_page")
      .map((b: any) => ({ id: b.link_to_page.page_id, order: b.order })),
    hasParagraphs: children.some(
      (b) =>
        (b as any).type === "paragraph" &&
        (b as any).paragraph.rich_text.length > 0
    ),
  }
}

export async function notionPageFromId(
  pageId: string,
  client: Client,
  config?: NotionPageConfig
): Promise<NotionPage> {
  const metadata = await client.pages.retrieve({
    page_id: pageId,
  })

  if (!isFullPage(metadata)) {
    throw Error("Non full response for page: " + pageId)
  }

  //logDebug("notion metadata", JSON.stringify(metadata));
  return new NotionPage(metadata, config)
}

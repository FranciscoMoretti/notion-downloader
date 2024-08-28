import {
  DatabaseObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints"

import { NotionObject } from "./NotionObject"
import { parseLinkId } from "./plugins/internalLinks"

// Response wrapper access class
export class NotionDatabase implements NotionObject {
  public metadata: DatabaseObjectResponse

  public constructor(metadata: DatabaseObjectResponse) {
    this.metadata = metadata
  }

  // TODO: Maybe remove or move into util function
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

  public get id() {
    return this.metadata.id
  }

  public get lastEditedTime() {
    return this.metadata.last_edited_time
  }

  public get object() {
    return this.metadata.object
  }

  // Deprecated
  public get type() {
    return this.metadata.object
  }

  // In Notion, pages from the Outline have "title"'s.
  public get title(): string {
    return this.richTextItemArrayToPlainText(
      this.metadata.title,
      "title missing"
    )
  }

  // TODO: Move to util
  private richTextItemArrayToPlainText(
    textArray: RichTextItemResponse[],
    defaultIfEmpty: string = ""
  ) {
    //console.log("textarray:" + JSON.stringify(textArray, null, 2));
    return textArray && textArray.length
      ? (textArray
          .map((item: { plain_text: any }) => item.plain_text)
          .join("") as string)
      : defaultIfEmpty
  }
}

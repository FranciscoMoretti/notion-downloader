import { Client } from "@notionhq/client"
import {
  BlockObjectResponse,
  ListBlockChildrenResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { ListBlockChildrenResponseResults } from "notion-to-md/build/types"

import { NotionBlock } from "./types"

export async function getBlockChildren(
  id: string,
  client: Client
): Promise<NotionBlock[]> {
  // we can only get so many responses per call, so we set this to
  // the first response we get, then keep adding to its array of blocks
  // with each subsequent response
  let overallResult: ListBlockChildrenResponse | undefined =
    await client.blocks.children.list({ block_id: id })

  const result = (overallResult?.results as BlockObjectResponse[]) ?? []
  // TODO - rethink if this numbering should be part of the downloading part of the app, or of the processing part
  numberChildrenIfNumberedList(result)
  return result
}
// This function is copied (and renamed from modifyNumberedListObject) from notion-to-md.
// They always run it on the results of their getBlockChildren.
// When we use our own getBlockChildren, we need to run it too.

export function numberChildrenIfNumberedList(
  blocks: ListBlockChildrenResponseResults
): void {
  let numberedListIndex = 0

  for (const block of blocks) {
    if ("type" in block && block.type === "numbered_list_item") {
      // add numbers
      // @ts-ignore
      block.numbered_list_item.number = ++numberedListIndex
    } else {
      numberedListIndex = 0
    }
  }
}

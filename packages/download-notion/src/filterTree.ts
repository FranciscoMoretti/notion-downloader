import { NotionObjectResponse, NotionObjectTree } from "notion-downloader"

import { NotionDatabase } from "./NotionDatabase"
import { getNotionObject } from "./NotionObjectUtils"
import { NotionPage } from "./NotionPage"
import { verbose } from "./log"

export function filterTree(
  objectsTree: NotionObjectTree,
  expectedStatusTag: string
) {
  function shouldFilterPageStatus(
    notionObject: NotionDatabase | NotionPage
  ): boolean {
    return (
      expectedStatusTag !== "" &&
      notionObject.object == "page" &&
      expectedStatusTag !== "*" &&
      notionObject.status !== expectedStatusTag
    )
  }

  const nodeAction = (
    objectResponse: NotionObjectResponse,
    parentContext: { shouldRemove: boolean },
    tree: NotionObjectTree
  ) => {
    if (parentContext.shouldRemove) {
      verbose(
        `Skipping [${objectResponse.object}] (${objectResponse.id}) because parent has been filtered`
      )
      tree.removeObject(objectResponse.id)
      return { shouldRemove: true }
    }

    if (
      // TODO: We should filter databases as well (for wikis)
      objectResponse.object === "page" &&
      shouldFilterPageStatus(getNotionObject(objectResponse) as NotionPage)
    ) {
      const notionObject = getNotionObject(objectResponse) as NotionPage
      verbose(
        `Skipping [${objectResponse.object}] (${objectResponse.id}) ${
          notionObject.title
        } ${`because it has status ${notionObject.status}`}`
      )

      tree.removeObject(notionObject.id)
      return { shouldRemove: true }
    }
    return { shouldRemove: false }
  }

  objectsTree.traverse(nodeAction, { shouldRemove: false })
}

import { NotionObjectResponse, NotionObjectTree } from "notion-downloader"

import { verbose } from "./log"
import { NotionDatabase } from "./notionObjects/NotionDatabase"
import { getNotionObject } from "./notionObjects/NotionObjectUtils"
import { NotionPage } from "./notionObjects/NotionPage"

export function filterTree(
  objectsTree: NotionObjectTree,
  statusPropertyName: string,
  statusPropertyValue: string
) {
  function shouldFilterPageStatus(
    notionObject: NotionDatabase | NotionPage
  ): boolean {
    if (notionObject.object !== "page") {
      return false
    }
    const pageStatus = notionObject.getGenericProperty(statusPropertyName)
    return (
      statusPropertyValue !== "" &&
      statusPropertyValue !== "*" &&
      pageStatus !== statusPropertyValue
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
        } ${`because it has status ${notionObject.getGenericProperty(
          statusPropertyName
        )}`}`
      )

      tree.removeObject(notionObject.id)
      return { shouldRemove: true }
    }
    return { shouldRemove: false }
  }

  objectsTree.traverse(nodeAction, { shouldRemove: false })
}

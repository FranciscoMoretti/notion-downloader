import { ObjectType } from "notion-cache-client"
import { NotionObjectResponse, NotionObjectTree } from "notion-downloader"

import { verbose } from "../log"
import { NotionDatabase } from "../notionObjects/NotionDatabase"
import { getNotionObject } from "../notionObjects/NotionObjectUtils"
import { NotionPage } from "../notionObjects/NotionPage"

export function filterTree(
  objectsTree: NotionObjectTree,
  statusPropertyName: string,
  statusPropertyValue: string
) {
  function shouldFilterPageStatus(
    notionObject: NotionDatabase | NotionPage
  ): boolean {
    if (notionObject.object !== ObjectType.enum.page) {
      return false
    }
    const pageStatus = notionObject.getGenericProperty(statusPropertyName)
    const isDatabaseChild = notionObject.isDatabaseChild
    return (
      isDatabaseChild &&
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
      tree.removeObject(
        ObjectType.parse(objectResponse.object),
        objectResponse.id
      )
      return { shouldRemove: true }
    }

    if (
      objectResponse.object === ObjectType.enum.page &&
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

      tree.removeObject(
        ObjectType.parse(objectResponse.object),
        objectResponse.id
      )
      return { shouldRemove: true }
    }
    return { shouldRemove: false }
  }

  objectsTree.traverse(nodeAction, { shouldRemove: false })
}

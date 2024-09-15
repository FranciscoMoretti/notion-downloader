import { ObjectType, ObjectTypeSchema } from "notion-cache-client"
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
    if (notionObject.object !== ObjectType.Page) {
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
      tree.removeObject(
        ObjectTypeSchema.parse(objectResponse.object),
        objectResponse.id
      )
      return { shouldRemove: true }
    }

    if (
      objectResponse.object === ObjectType.Page &&
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
        ObjectTypeSchema.parse(objectResponse.object),
        objectResponse.id
      )
      return { shouldRemove: true }
    }
    return { shouldRemove: false }
  }

  objectsTree.traverse(nodeAction, { shouldRemove: false })
}

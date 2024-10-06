import { ObjectType } from "notion-cache-client"
import { NotionObjectResponse, NotionObjectTree } from "notion-tree"

import { Filter } from "../config/schema"
import { verbose } from "../log"
import { NotionDatabase } from "../notionObjects/NotionDatabase"
import { NotionObject } from "../notionObjects/NotionObject"
import { getNotionObject } from "../notionObjects/NotionObjectUtils"
import { NotionPage } from "../notionObjects/NotionPage"

function shouldFilter(
  notionObject: NotionDatabase | NotionPage,
  filter: Filter
): boolean {
  if (filter.fitlerType === "property") {
    if (notionObject.object !== ObjectType.enum.page) {
      return false
    }

    const pageStatus = notionObject.getPropertyAsPlainText(filter.propertyName)
    const isDatabaseChild = notionObject.isDatabaseChild

    const filterResult =
      isDatabaseChild &&
      filter.propertyValue !== "" &&
      filter.propertyValue !== "*" &&
      pageStatus !== filter.propertyValue
    if (filterResult) {
      verbose(
        `Filtering ${notionObject.id} because ${filter.propertyName} is ${pageStatus} and filter is ${filter.propertyValue}`
      )
    }
    return filterResult
  }
  return false
}

export function filterTree(objectsTree: NotionObjectTree, filters: Filter[]) {
  function failsAnyFilter(notionObject: NotionDatabase | NotionPage): boolean {
    for (const filter of filters) {
      if (shouldFilter(notionObject, filter)) {
        return true
      }
    }
    return false
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
      failsAnyFilter(getNotionObject(objectResponse) as NotionPage)
    ) {
      const notionObject = getNotionObject(objectResponse) as NotionPage
      verbose(
        `Skipping [${objectResponse.object}] (${objectResponse.id}) ${
          notionObject.title
        } ${`because it was filtered`}`
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

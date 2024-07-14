import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

export type NotionObjectTreeNode =
  | {
      id: string
      object: "database" | "page"
      children: Array<NotionObjectTreeNode>
    }
  | {
      id: string
      object: "block"
      type: string
      has_children: boolean
      children: Array<NotionObjectTreeNode>
    }

export type DatabaseChildrenCache = Record<
  string,
  {
    children: string[]
  }
>

export type NotionObjectsCache = Record<
  string,
  PageObjectResponse | DatabaseObjectResponse | BlockObjectResponse
>

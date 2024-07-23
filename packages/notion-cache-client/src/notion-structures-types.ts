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

export type BlocksChildrenCache = Record<
  string,
  {
    children: string[]
  }
>

export type DatabaseChildrenCache = Record<
  string,
  {
    children: string[]
  }
>

export type NotionPageObjectsCache = Record<string, PageObjectResponse>
export type NotionDatabaseObjectsCache = Record<string, DatabaseObjectResponse>
export type NotionBlockObjectsCache = Record<string, BlockObjectResponse>

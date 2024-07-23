import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

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

import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

export type CacheInfo = {
  __needs_refresh: boolean
}

export type CacheData<T> = {
  data: T
} & CacheInfo

export type BlocksChildrenCache = Record<
  string,
  CacheData<{
    children: string[]
  }>
>

export type DatabaseChildrenCache = Record<
  string,
  CacheData<{
    children: string[]
  }>
>

export type NotionPageObjectsCache = Record<
  string,
  CacheData<PageObjectResponse>
>
export type NotionDatabaseObjectsCache = Record<
  string,
  CacheData<DatabaseObjectResponse>
>
export type NotionBlockObjectsCache = Record<
  string,
  CacheData<BlockObjectResponse>
>

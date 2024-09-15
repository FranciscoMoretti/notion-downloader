import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

import { ObjectType } from "./notion-types"

export enum CacheType {
  BLOCKS_CHILDREN = "blocks_children",
  DATABASE_CHILDREN = "database_children",
  BLOCK = "block",
  DATABASE = "database",
  PAGE = "page",
}

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

export function getCacheType(object: string): CacheType {
  switch (object) {
    case ObjectType.Block:
      return CacheType.BLOCK
    case ObjectType.Database:
      return CacheType.DATABASE
    case ObjectType.Page:
      return CacheType.PAGE
    default:
      throw new Error(`Invalid object type: ${object}`)
  }
}

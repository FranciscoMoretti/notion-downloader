import {
  BlockObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import fs from "fs-extra"

import { ObjectType } from "./notion-types"

export async function saveObjectToJson(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  await fs.writeFile(filename, json)
}

export async function loadDataFromJson(filePath: string) {
  if (fs.existsSync(filePath)) {
    return fs.readFile(filePath, "utf8").then((data) => JSON.parse(data))
  }
  return Promise.resolve(undefined)
}

export function convertToUUID(str: string): string {
  if (str.length !== 32) {
    throw new Error("Input string must be 32 characters long")
  }
  return `${str.slice(0, 8)}-${str.slice(8, 12)}-${str.slice(
    12,
    16
  )}-${str.slice(16, 20)}-${str.slice(20)}`
}

export type SimpleParent = {
  object: ObjectType
  id: string
}

export function simplifyParentObject(
  parent:
    | PageObjectResponse["parent"]
    | DatabaseObjectResponse["parent"]
    | BlockObjectResponse["parent"]
): SimpleParent | null {
  if (parent.type === "workspace") {
    return null
  } else if (parent.type === "page_id") {
    return { id: parent.page_id, object: ObjectType.Page }
  } else if (parent.type === "database_id") {
    return { id: parent.database_id, object: ObjectType.Database }
  } else if (parent.type === "block_id") {
    return { id: parent.block_id, object: ObjectType.Block }
  } else {
    throw new Error(`Unknown parent type: ${parent}`)
  }
}

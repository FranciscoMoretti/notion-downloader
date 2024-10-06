// Add this new interface

import { ObjectType } from "notion-cache-client"

export interface NotionObject {
  id: string
  lastEditedTime: string
  object: ObjectType
}

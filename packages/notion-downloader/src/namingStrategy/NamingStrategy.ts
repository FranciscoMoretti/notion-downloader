import { ObjectType, PageOrDatabase } from "notion-cache-client"

import { AssetType } from "../config/schema"
import { NotionObject } from "../notionObjects/NotionObject"
import { NotionFileLikeObjects } from "../notionObjects/objectTypes"

export type NameableType = PageOrDatabase | AssetType

export const allNameableTypes: NameableType[] = [
  ObjectType.enum.page,
  ObjectType.enum.database,
  AssetType.enum.image,
  AssetType.enum.file,
  AssetType.enum.video,
  AssetType.enum.pdf,
  AssetType.enum.audio,
]

export abstract class NamingStrategy {
  private accepts: Set<NameableType>

  constructor(accepts: NameableType[]) {
    this.accepts = new Set(accepts)
  }

  public getName(notionObject: NotionFileLikeObjects): string {
    this.verifyAcceptsObject(notionObject)
    return this._nameForObject(notionObject)
  }

  public getFilename(notionObject: NotionFileLikeObjects) {
    const name = this.getName(notionObject)
    const extension = notionObject.extension
    return name + "." + extension
  }

  protected abstract _nameForObject(notionObject: NotionObject): string

  private verifyAcceptsObject(notionObject: NotionFileLikeObjects): void {
    if (!this.acceptsObject(notionObject)) {
      throw new Error(
        `Naming strategy does not accept ${notionObject.object} objects`
      )
    }
  }

  public acceptsObject(notionObject: NotionFileLikeObjects): boolean {
    if (notionObject.object === ObjectType.enum.page) {
      return this.accepts.has(ObjectType.enum.page)
    }
    if (notionObject.object === ObjectType.enum.database) {
      return this.accepts.has(ObjectType.enum.database)
    }
    return this.accepts.has(notionObject.assetType)
  }
}

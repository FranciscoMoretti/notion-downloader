import { AssetType, FileType, ObjectType } from "../config/schema"
import { NotionObject } from "../notionObjects/NotionObject"
import { NotionFileLikeObjects } from "../notionObjects/objectTypes"

export type NameableType = ObjectType.Page | ObjectType.Database | AssetType

export const allNameableTypes: NameableType[] = [
  ObjectType.Page,
  ObjectType.Database,
  AssetType.Image,
  AssetType.File,
  AssetType.Video,
  AssetType.PDF,
  AssetType.Audio,
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
    if (notionObject.object === ObjectType.Page) {
      return this.accepts.has(ObjectType.Page)
    }
    if (notionObject.object === ObjectType.Database) {
      return this.accepts.has(ObjectType.Database)
    }
    return this.accepts.has(notionObject.assetType)
  }
}

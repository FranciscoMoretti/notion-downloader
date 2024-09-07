import { NotionDatabase } from "./../NotionDatabase"
import { NotionImage } from "./../NotionImage"
import { NotionObject } from "./../NotionObject"
import { NotionPage } from "./../NotionPage"

export type NotionFileLikeObjects = NotionPage | NotionImage
export type NotionFolderLikeObjects = NotionPage | NotionDatabase

export abstract class NamingStrategy {
  private accepts: Set<"page" | "database" | "block">

  constructor(accepts: ("page" | "database" | "block")[]) {
    this.accepts = new Set(accepts)
  }

  public getName(notionObject: NotionObject): string {
    this.verifyAcceptsObject(notionObject)
    return this._nameForObject(notionObject)
  }

  public getFilename(notionObject: NotionFileLikeObjects) {
    const name = this.getName(notionObject)
    const extension = this.getFileExtension(notionObject)
    return name + "." + extension
  }

  protected abstract _nameForObject(notionObject: NotionObject): string

  private getFileExtension(notionObject: NotionFileLikeObjects) {
    if (notionObject.object == "page") {
      return "md"
    } else if (notionObject.object == "block" && notionObject.type == "image") {
      // TODO: Might need to read the file to get the extension!
      return notionObject.extension
    }
  }

  private verifyAcceptsObject(notionObject: NotionObject): void {
    if (!this.acceptsObject(notionObject)) {
      throw new Error(
        `Naming strategy does not accept ${notionObject.object} objects`
      )
    }
  }

  public acceptsObject(notionObject: NotionObject): boolean {
    return this.accepts.has(notionObject.object)
  }
}

import { NotionDatabase } from "./NotionDatabase"
import { NotionObject } from "./NotionObject"
import { NotionPage } from "./NotionPage"

export abstract class NamingStrategy {
  private accepts: Set<"page" | "database" | "block">

  constructor(accepts: ("page" | "database" | "block")[]) {
    this.accepts = new Set(accepts)
  }

  public getName(notionObject: NotionObject): string {
    this.verifyAcceptsObject(notionObject)
    return this._nameForObject(notionObject)
  }

  protected abstract _nameForObject(notionObject: NotionObject): string

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

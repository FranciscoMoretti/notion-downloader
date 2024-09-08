import { NotionFileLikeObjects, NotionImageLike } from "../objectTypes"
import { NamingStrategy } from "./NamingStrategy"

export class DefaultBlockNamingStrategy extends NamingStrategy {
  private readonly getPageAncestorName: (image: NotionImageLike) => string

  constructor(getPageAncestorName: (image: NotionImageLike) => string) {
    // TODO: Consider another criteria for accepting. Images can be a block or cover (page, db)
    super(["block", "database", "page"])
    this.getPageAncestorName = getPageAncestorName
  }

  protected _nameForObject(notionObject: NotionImageLike): string {
    // Don't start with . for empty ancestor page name
    const pageSlugPart = this.getPageAncestorName(notionObject)
      ? `${this.getPageAncestorName(notionObject)}.`
      : ""
    return `${pageSlugPart}${notionObject.id}`
  }

  public getFilename(notionObject: NotionImageLike): string {
    const name = this.getName(notionObject)
    return name + "." + notionObject.extension
  }
}

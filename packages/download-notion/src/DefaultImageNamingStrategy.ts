import { NamingStrategy, NotionFileLikeObjects } from "./NamingStrategy"
import { NotionImage } from "./NotionImage"

export class DefaultBlockNamingStrategy extends NamingStrategy {
  private readonly getPageAncestorName: (image: NotionImage) => string

  constructor(getPageAncestorName: (image: NotionImage) => string) {
    // TODO: Consider another criteria for accepting. Images can be a block or cover (page, db)
    super(["block", "database", "page"])
    this.getPageAncestorName = getPageAncestorName
  }

  protected _nameForObject(notionObject: NotionImage): string {
    // Don't start with . for empty ancestor page name
    const pageSlugPart = this.getPageAncestorName(notionObject)
      ? `${this.getPageAncestorName(notionObject)}.`
      : ""
    return `${pageSlugPart}${notionObject.id}`
  }

  public getFilename(notionObject: NotionImage): string {
    const name = this.getName(notionObject)
    return name + "." + notionObject.extension
  }
}

import {
  NotionFileLikeObjects,
  NotionImageLike,
} from "../notionObjects/objectTypes"
import { NamingStrategy, allNameableTypes } from "./NamingStrategy"

export class DefaultBlockNamingStrategy extends NamingStrategy {
  private readonly getPageAncestorName: (image: NotionImageLike) => string

  constructor(getPageAncestorName: (image: NotionImageLike) => string) {
    // TODO: Consider another criteria for accepting. Images can be a block or cover (page, db)
    super(allNameableTypes)
    this.getPageAncestorName = getPageAncestorName
  }

  protected _nameForObject(notionObject: NotionImageLike): string {
    // Don't start with . for empty ancestor page name
    const pageSlugPart = this.getPageAncestorName(notionObject)
      ? `${this.getPageAncestorName(notionObject)}.`
      : ""
    return `${pageSlugPart}${notionObject.id}`
  }

  public getFilename(notionObject: NotionFileLikeObjects): string {
    const name = this.getName(notionObject)
    return name + "." + notionObject.extension
  }
}

import { NotionObject } from "../notionObjects/NotionObject"
import { NotionFileLikeObjects } from "../notionObjects/objectTypes"
import { NamingStrategy, allNameableTypes } from "./NamingStrategy"

export class AncestorPrefixAssetNamingStrategy extends NamingStrategy {
  private readonly getPageAncestorName: (notionObject: NotionObject) => string

  constructor(getPageAncestorName: (notionObject: NotionObject) => string) {
    super(allNameableTypes)
    this.getPageAncestorName = getPageAncestorName
  }

  protected _nameForObject(notionObject: NotionObject): string {
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

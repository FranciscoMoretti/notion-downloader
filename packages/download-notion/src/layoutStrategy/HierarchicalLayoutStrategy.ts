import { NamingStrategy } from "../namingStrategy/NamingStrategy"
import { NotionPage } from "../notionObjects/NotionPage"
import { NotionFileLikeObjects, NotionFolderLikeObjects } from "../objectTypes"
import { LayoutStrategy } from "./LayoutStrategy"

// This strategy gives us a file tree that mirrors that of notion.
// Each level in the outline becomes a directory, and each file bears the name of the Notion document.
// As long as you use slugs, the urls is still just something like https://site/slug

export class HierarchicalLayoutStrategy extends LayoutStrategy {
  namingStrategy: NamingStrategy

  constructor(namingStrategy: NamingStrategy) {
    super()
    this.namingStrategy = namingStrategy
  }

  public newPathLevel(
    currentPath: string,
    notionObject: NotionFolderLikeObjects
  ): string {
    const extendPath = this.namingStrategy.getName(notionObject as NotionPage)
    const path = ("/" + currentPath + "/" + extendPath).replaceAll("//", "/")
    return path
  }

  public getPathForObject(
    currentPath: string,
    notionObject: NotionFileLikeObjects
  ): string {
    const sanitizedName = this.namingStrategy.getFilename(notionObject)

    const context = ("/" + currentPath + "/").replaceAll("//", "/")
    const path = context + sanitizedName

    return path
  }
}

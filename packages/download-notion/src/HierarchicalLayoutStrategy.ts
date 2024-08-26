import fs from "fs-extra"
import sanitize from "sanitize-filename"

import { LayoutStrategy } from "./LayoutStrategy"
import { NamingStrategy } from "./NamingStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"

// This strategy gives us a file tree that mirrors that of notion.
// Each level in the outline becomes a directory, and each file bears the name of the Notion document.
// As long as you use slugs, the urls is still just something like https://site/slug

export class HierarchicalLayoutStrategy extends LayoutStrategy {
  namingStrategy: NamingStrategy

  constructor(namingStrategy: NamingStrategy) {
    super()
    this.namingStrategy = namingStrategy
  }

  public newLevel(
    context: string,
    pageOrDatabaseName: NotionPage | NotionDatabase
  ): string {
    const extendPath =
      pageOrDatabaseName.metadata.object === "page"
        ? this.namingStrategy.nameForPage(pageOrDatabaseName as NotionPage)
        : this.namingStrategy.nameForDatabase(
            pageOrDatabaseName as NotionDatabase
          )
    const path = ("/" + context + "/" + extendPath).replaceAll("//", "/")
    return path
  }

  public getPathForPage2(page: NotionPage, currentPath: string): string {
    const sanitizedName = this.namingStrategy.nameForPage(page)

    const context = ("/" + currentPath + "/").replaceAll("//", "/")
    const path = context + sanitizedName + ".md"

    return path
  }
}

import fs from "fs-extra"
import sanitize from "sanitize-filename"

import { LayoutStrategy } from "./LayoutStrategy"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"
import { NotionPage2 } from "./NotionPage2"

// This strategy gives us a file tree that mirrors that of notion.
// Each level in the outline becomes a directory, and each file bears the name of the Notion document.
// As long as you use slugs, the urls is still just something like https://site/slug

export class HierarchicalNamedLayoutStrategy extends LayoutStrategy {
  public newLevel(context: string, levelLabel: string): string {
    const path = context + "/" + sanitize(levelLabel).replaceAll(" ", "-")
    return path
  }

  public getPathForPage2(page: NotionPage2, currentPath: string): string {
    // TODO: Fix inconsistency, it seems we are sanitizing in two places
    const sanitizedName = this.toFileName(page.nameForFile())

    const context = ("/" + currentPath + "/").replaceAll("//", "/")
    const path = this.rootDirectory + context + sanitizedName + ".md"

    return path
  }
  public getPathForDatabase(
    database: NotionDatabase,
    currentPath: string
  ): string {
    // TODO: Fix inconsistency, database name is being turned into folder at level creation. They are the same
    const context = ("/" + currentPath + "/").replaceAll("//", "/")
    const path = this.rootDirectory + context
    return path
  }
  // TODO: Consider moving to an util. Or is it part of the naming strategy?
  private toFileName(name: string) {
    return (
      sanitize(name)
        .replaceAll("//", "/")
        .replaceAll("%20", "-")
        .replaceAll(" ", "-")
        // crowdin complains about some characters in file names. I haven't found
        // the actual list, so these are from memory.
        .replaceAll('"', "")
        .replaceAll("“", "")
        .replaceAll("”", "")
        .replaceAll("'", "")
        .replaceAll("?", "-")
    )
  }
}

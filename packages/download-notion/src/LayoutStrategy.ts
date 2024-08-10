import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"

// Here a fuller name would be File Tree Layout Strategy. That is,
// as we walk the Notion outline and create files, where do we create them, what do we name them, etc.
export abstract class LayoutStrategy {
  public abstract newLevel(
    // TODO: Fix incosnsistency in naming `context` and `currentPath`
    context: string,
    pageOrDatabaseName: NotionPage | NotionDatabase
  ): string

  public abstract getPathForPage2(page: NotionPage, currentPath: string): string
}

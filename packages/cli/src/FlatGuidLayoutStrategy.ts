import { LayoutStrategy } from "./LayoutStrategy"
import { NotionPage } from "./NotionPage"

// This strategy creates a flat list of files that have notion-id for file names.
// Pros: the urls will never change so long as the notion pages are not delete and re-recreated.
// Cons: the names are not human readable, so:
//    * troubleshooting is more difficult
//    * is less "future" proof, in the sense that if you someday take these files and move them
//    * to a new system, maybe you will wish the files had names.

// TODO: Fill this with the new interface of pagename databasename etc once its ready
// the directory/file structure itself is no longer representative of the outline we want.
export class FlatGuidLayoutStrategy extends LayoutStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public newLevel(
    rootDir: string,
    order: number,
    context: string,
    _levelLabel: string
  ): string {
    // In this strategy, we ignore context and don't create any directories to match the levels.
    // Just return the following for the benefit of logging.
    return context + "/" + _levelLabel
  }

  public getPathForPage(page: NotionPage, extensionWithDot: string): string {
    // In this strategy, we don't care about the location or the title
    return this.rootDirectory + "/" + page.pageId + extensionWithDot
  }
}

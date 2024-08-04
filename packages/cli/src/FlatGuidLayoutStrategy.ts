import { LayoutStrategy } from "./LayoutStrategy"
import { NotionPage } from "./NotionPage"
import { NotionPage2 } from "./NotionPage2"

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
  public newLevel(context: string, levelLabel: string): string {
    // In this strategy, we ignore context and don't create any directories to match the levels.
    // Just return the following for the benefit of logging.
    return context + "/" + levelLabel
  }

  public getPathForPage(page: NotionPage, extensionWithDot: string): string {
    // In this strategy, we don't care about the location or the title
    return this.rootDirectory + "/" + page.pageId + extensionWithDot
  }
  public getPathForPage2(page: NotionPage2, extensionWithDot: string): string {
    // In this strategy, we don't care about the location or the title
    return this.rootDirectory + "/" + page.id + extensionWithDot
  }
}

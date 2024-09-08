import { NamingStrategy } from "../namingStrategy/NamingStrategy"
import {
  NotionFileLikeObjects,
  NotionFolderLikeObjects,
} from "../notionObjects/objectTypes"
import { LayoutStrategy } from "./LayoutStrategy"

// This strategy creates a flat list of files that have notion-id for file names.
// Pros: the urls will never change so long as the notion pages are not delete and re-recreated.
// Cons: the names are not human readable, so:
//    * troubleshooting is more difficult
//    * is less "future" proof, in the sense that if you someday take these files and move them
//    * to a new system, maybe you will wish the files had names.
// the directory/file structure itself is no longer representative of the outline we want.
export class FlatLayoutStrategy extends LayoutStrategy {
  namingStrategy: NamingStrategy

  constructor(namingStrategy: NamingStrategy) {
    super()
    this.namingStrategy = namingStrategy
  }

  public newPathLevel(
    currentPath: string,
    notionObject: NotionFolderLikeObjects
  ): string {
    // In this strategy, we ignore context and don't create any directories to match the levels.
    // Just return the following for the benefit of logging.
    return currentPath
  }

  public getPathForObject(
    currentPath: string,
    notionObject: NotionFileLikeObjects
  ): string {
    return "/" + this.namingStrategy.getFilename(notionObject)
  }
}

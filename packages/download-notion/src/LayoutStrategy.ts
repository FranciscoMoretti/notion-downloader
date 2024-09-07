import {
  NotionFileLikeObjects,
  NotionFolderLikeObjects,
} from "./NamingStrategy"

// Here a fuller name would be File Tree Layout Strategy. That is,
// as we walk the Notion outline and create files, where do we create them, what do we name them, etc.
export abstract class LayoutStrategy {
  public abstract newPathLevel(
    currentPath: string,
    notionObject: NotionFolderLikeObjects
  ): string

  public abstract getPathForObject(
    currentPath: string,
    notionObject: NotionFileLikeObjects
  ): string
}

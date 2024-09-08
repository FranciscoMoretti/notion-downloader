import { NotionBlockImage } from "./notionObjects/NotionBlockImage"
import { NotionCoverImage } from "./notionObjects/NotionCoverImage"
import { NotionDatabase } from "./notionObjects/NotionDatabase"
import { NotionPage } from "./notionObjects/NotionPage"

export type NotionImageLike = NotionBlockImage | NotionCoverImage
export type NotionFileLikeObjects = NotionPage | NotionImageLike
export type NotionFolderLikeObjects = NotionPage | NotionDatabase

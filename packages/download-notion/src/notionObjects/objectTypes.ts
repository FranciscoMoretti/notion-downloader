import { NotionBlockImage } from "./NotionBlockImage"
import { NotionCoverImage } from "./NotionCoverImage"
import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"

export type NotionImageLike = NotionBlockImage | NotionCoverImage
export type NotionFileLikeObjects = NotionPage | NotionImageLike
export type NotionFolderLikeObjects = NotionPage | NotionDatabase

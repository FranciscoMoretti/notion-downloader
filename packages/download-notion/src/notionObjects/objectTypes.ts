import { AssetType, FileType } from "../config/schema"
import { NotionBlockImage } from "./NotionBlockImage"
import { NotionCoverImage } from "./NotionCoverImage"
import { NotionDatabase } from "./NotionDatabase"
import { NotionFile } from "./NotionFile"
import { NotionObject } from "./NotionObject"
import { NotionPage } from "./NotionPage"

export interface iNotionAssetObject extends NotionFile, NotionObject {
  assetType: AssetType
  fileType: FileType
}

export type NotionImageLike = NotionBlockImage | NotionCoverImage
export type NotionFileLikeObjects =
  | NotionPage
  | NotionImageLike
  | iNotionAssetObject
export type NotionFolderLikeObjects = NotionPage | NotionDatabase

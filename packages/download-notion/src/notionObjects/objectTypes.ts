import { AssetType } from "../files/FilesMap"
import { NotionBlockImage } from "./NotionBlockImage"
import { NotionCoverImage } from "./NotionCoverImage"
import { NotionDatabase } from "./NotionDatabase"
import { NotionFile } from "./NotionFile"
import { NotionObject } from "./NotionObject"
import { NotionPage } from "./NotionPage"

export interface iNotionAssetObject extends NotionFile, NotionObject {
  assetType: AssetType
}
export type NotionImageLike = NotionBlockImage | NotionCoverImage
export type NotionFileLikeObjects = NotionPage | NotionImageLike | NotionFile
export type NotionFolderLikeObjects = NotionPage | NotionDatabase

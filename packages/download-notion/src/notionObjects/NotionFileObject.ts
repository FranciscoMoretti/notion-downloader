import {
  AudioBlockObjectResponse,
  FileBlockObjectResponse,
  ImageBlockObjectResponse,
  PdfBlockObjectResponse,
  VideoBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { ObjectType } from "notion-cache-client"

import { AssetType, FileType, mapToAssetType } from "../config/schema"
import { NotionFile } from "./NotionFile"
import { iNotionAssetObject } from "./objectTypes"

export type NotionFileObjectResponses =
  | ImageBlockObjectResponse
  | FileBlockObjectResponse
  | AudioBlockObjectResponse
  | PdfBlockObjectResponse
  | VideoBlockObjectResponse

export class NotionFileObject extends NotionFile implements iNotionAssetObject {
  private metadata: NotionFileObjectResponses
  public assetType: AssetType
  public fileType: FileType = AssetType.enum.image

  constructor(fileObjectResponse: NotionFileObjectResponses) {
    const file = getFileFromObjectResponse(fileObjectResponse)
    if (!file) {
      throw new Error("File not found")
    }
    super(file)
    this.metadata = fileObjectResponse
    this.assetType = mapToAssetType(fileObjectResponse.type)
  }

  get id(): string {
    return this.metadata.id
  }

  get object() {
    return ObjectType.parse(this.metadata.object)
  }

  get type() {
    return this.metadata.type
  }

  get lastEditedTime(): string {
    return this.metadata.last_edited_time
  }
}

function getFileFromObjectResponse(
  fileObjectResponse: NotionFileObjectResponses
) {
  if (fileObjectResponse.type === "image") {
    return fileObjectResponse["image"]
  } else if (fileObjectResponse.type === "file") {
    return fileObjectResponse["file"]
  } else if (fileObjectResponse.type === "audio") {
    return fileObjectResponse["audio"]
  } else if (fileObjectResponse.type === "pdf") {
    return fileObjectResponse["pdf"]
  } else if (fileObjectResponse.type === "video") {
    return fileObjectResponse["video"]
  }
}

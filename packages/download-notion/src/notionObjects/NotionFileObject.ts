import {
  AudioBlockObjectResponse,
  FileBlockObjectResponse,
  ImageBlockObjectResponse,
  PdfBlockObjectResponse,
  VideoBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

import { AssetType } from "../files/FilesMap"
import { NotionFile } from "./NotionFile"
import { iNotionAssetObject } from "./objectTypes"

type NotionFileObjectResponses =
  | ImageBlockObjectResponse
  | FileBlockObjectResponse
  | AudioBlockObjectResponse
  | PdfBlockObjectResponse
  | VideoBlockObjectResponse

export class NotionFileObject extends NotionFile implements iNotionAssetObject {
  private metadata: NotionFileObjectResponses
  public assetType: AssetType

  constructor(fileObjectResponse: NotionFileObjectResponses) {
    const file = getFileFromObjectResponse(fileObjectResponse)
    if (!file) {
      throw new Error("File not found")
    }
    super(file)
    this.metadata = fileObjectResponse
    this.assetType = fileObjectResponse.type
  }

  get id(): string {
    return this.metadata.id
  }

  get object() {
    return this.metadata.object
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

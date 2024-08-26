import { isFullBlock, isFullPage } from "@notionhq/client"
import {
  ImageBlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

import { getImageFileExtension } from "./getImageFileExtension"
import { FileData, ImageSet, readPrimaryImage } from "./images"
import { getImageUrl } from "./notion_objects_utils"

export type PageObjectResponseWithCover = PageObjectResponse & {
  cover: NonNullable<PageObjectResponse["cover"]>
}
type NotionImageResponses =
  | ImageBlockObjectResponse
  | PageObjectResponseWithCover

export class NotionImage {
  private imageSet: ImageSet
  private fileData: FileData | null = null
  private metadata: ImageBlockObjectResponse | PageObjectResponseWithCover

  constructor(imageResponse: NotionImageResponses) {
    if (isFullBlock(imageResponse) && imageResponse.type === "image") {
      this.imageSet = this.parseImageBlock(imageResponse)
    } else if (isFullPage(imageResponse)) {
      this.imageSet = this.parseCoverImage(imageResponse)
    } else {
      throw new Error("Invalid image response")
    }
    this.metadata = imageResponse
  }

  private parseImageBlock(imageBlock: ImageBlockObjectResponse): ImageSet {
    const imageObject = imageBlock.image
    return {
      primaryUrl: getImageUrl(imageObject),
      caption:
        imageBlock.image.caption?.map((c) => c.plain_text).join("") || "",
    }
  }
  private parseCoverImage(page: PageObjectResponseWithCover): ImageSet {
    const primaryUrl = getImageUrl(page.cover)
    return { primaryUrl, caption: "" }
  }

  async read(): Promise<FileData> {
    if (this.fileData) {
      return this.fileData
    }

    const { primaryBuffer, fileType } = await readPrimaryImage(
      this.imageSet.primaryUrl
    )
    this.fileData = {
      extension: fileType.ext,
      mime: fileType.mime,
      buffer: primaryBuffer,
    }
    return this.fileData
  }

  getImageSet(): ImageSet {
    return this.imageSet
  }

  private getFileData(): FileData {
    if (!this.fileData) {
      throw new Error("File data not read yet")
    }
    return this.fileData
  }

  //   Property id access the id from the image block
  get id(): string {
    return this.metadata.id
  }

  get extension(): string {
    // TODO: Verify if failing if unknonwn mime type ever happens
    return this.getFileData().extension
    // return getImageFileExtension(
    //   this.imageSet.primaryUrl,
    //   this.getFileData().extension
    // )
  }

  get buffer(): Buffer {
    return this.getFileData().buffer
  }
}

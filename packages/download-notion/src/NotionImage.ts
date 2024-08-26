import * as Path from "path"
import { isFullBlock, isFullPage } from "@notionhq/client"
import {
  ImageBlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import fs from "fs-extra"

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
    if (imageResponse.object == "block" && imageResponse.type === "image") {
      this.imageSet = this.parseImageBlock(imageResponse)
    } else if (imageResponse.object == "page") {
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

  async read() {
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
  }

  async save(path: string) {
    // Create the directory recursively if it doesn't exist
    fs.ensureDirSync(Path.dirname(path))
    // Save with fs
    fs.writeFileSync(path, this.buffer)

    // const writeStream = fs.createWriteStream(path)
    // writeStream.write(this.buffer) // async but we're not waiting
    // writeStream.end()
  }

  get url(): string {
    return this.imageSet.primaryUrl
  }

  get caption(): string | undefined {
    return this.imageSet.caption
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

  get object(): "page" | "block" {
    return this.metadata.object
  }

  get lastEditedTime(): string {
    return this.metadata.last_edited_time
  }

  private getFileData(): FileData {
    if (!this.fileData) {
      throw new Error("File data not read. Run read() before accessing")
    }
    return this.fileData
  }
}

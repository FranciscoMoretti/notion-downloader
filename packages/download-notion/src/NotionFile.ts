import { FileBuffer } from "./imagesUtils"

export class NotionFile {
  private fileBuffer: FileBuffer | null = null
  private fileCore: FileCoreObject

  constructor(fileCore: FileCoreObject) {
    this.fileCore = fileCore
  }

  get file(): FileCoreObject {
    return this.fileCore
  }

  get hasFileBuffer(): boolean {
    return this.fileBuffer !== null
  }

  get url(): string {
    return this.fileCore.type == "external"
      ? this.fileCore.external.url
      : this.fileCore.file.url
  }

  get extension(): string {
    return this.getFileData().fileType.ext
  }

  get buffer(): Buffer {
    return this.getFileData().buffer
  }

  public setUrl(url: string) {
    if ("file" in this.fileCore) {
      this.fileCore.file.url = url
    } else {
      this.fileCore.external.url = url
    }
  }

  public setFileBuffer(fileBuffer: FileBuffer) {
    this.fileBuffer = fileBuffer
  }

  private getFileData(): FileBuffer {
    if (!this.fileBuffer) {
      throw new Error("File data not read. Run read() before accessing")
    }
    return this.fileBuffer
  }
}

export type FileCoreObject =
  | {
      type: "external"
      external: {
        url: string
      }
    }
  | {
      type: "file"
      file: {
        url: string
        expiry_time: string
      }
    }

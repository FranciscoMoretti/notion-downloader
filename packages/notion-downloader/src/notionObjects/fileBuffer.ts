import core from "file-type/core"

export type FileBuffer = {
  buffer: Buffer
  fileType: core.FileTypeResult
}

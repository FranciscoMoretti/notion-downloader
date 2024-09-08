import https from "https"
import * as Path from "path"
import axios from "axios"
import FileType from "file-type"
import core from "file-type/core"
import fs from "fs-extra"

import { NotionFile } from "./NotionFile"
import { verbose } from "./log"

export type OutputPaths = {
  primaryFileOutputPath: string
  filePathToUseInMarkdown: string
}

export type ImageSet = {
  url: string
  caption?: string
}

export function updateImageUrlToMarkdownImagePath(
  imageOrCover: NotionFile,
  filePathToUseInMarkdown: string
) {
  imageOrCover.setUrl(filePathToUseInMarkdown)
}

export type FileBuffer = {
  buffer: Buffer
  fileType: core.FileTypeResult
}

export async function readFile(
  source: string,
  type: "file" | "url"
): Promise<FileBuffer> {
  try {
    const buffer = await readBuffer(source, type)
    const fileType = await FileType.fromBuffer(buffer)

    if (!fileType) {
      throw new Error(`Failed to determine file type for file at ${source}`)
    }

    return { buffer, fileType }
  } catch (error) {
    console.error(`Error reading file from ${source}:`, error)
    throw error
  }
}

async function readBuffer(source: string, type: "file" | "url") {
  if (type === "url") {
    const response = await axios.get(source, {
      responseType: "arraybuffer",
      httpsAgent: new https.Agent({ keepAlive: true }),
      timeout: 10000,
    })
    return Buffer.from(response.data)
  } else if (type === "file") {
    return await fs.readFile(source)
  } else {
    throw new Error(`Invalid type ${type}`)
  }
}

export async function saveImage(path: string, buffer: Buffer): Promise<void> {
  writeImageIfNew(path, buffer)
}

function writeImageIfNew(path: string, buffer: Buffer) {
  // Note: it's tempting to not spend time writing this out if we already have
  // it from a previous run. But we don't really know it's the same. A) it
  // could just have the same name, B) it could have been previously
  // unlocalized and thus filled with a copy of the primary language image
  // while and now is localized.
  if (fs.pathExistsSync(path)) {
    verbose("Replacing image " + path)
  } else {
    verbose("Adding image " + path)
    fs.mkdirsSync(Path.dirname(path))
  }
  // Save image with image here
}

export async function saveFileBuffer(fileBuffer: FileBuffer, path: string) {
  // Create the directory recursively if it doesn't exist
  fs.ensureDirSync(Path.dirname(path))
  // Save with fs
  fs.writeFileSync(path, fileBuffer.buffer)

  // const writeStream = fs.createWriteStream(path)
  // writeStream.write(this.buffer) // async but we're not waiting
  // writeStream.end()
}

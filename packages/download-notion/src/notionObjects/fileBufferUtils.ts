import https from "https"
import * as Path from "path"
import axios from "axios"
import FileType from "file-type"
import fs from "fs-extra"

import { FileBuffer } from "./notionObjects/fileBuffer"

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

export async function saveFileBuffer(fileBuffer: FileBuffer, path: string) {
  // Create the directory recursively if it doesn't exist
  fs.ensureDirSync(Path.dirname(path))
  // Save with fs
  fs.writeFileSync(path, fileBuffer.buffer)

  // const writeStream = fs.createWriteStream(path)
  // writeStream.write(this.buffer) // async but we're not waiting
  // writeStream.end()
}

import https from "https"
import * as Path from "path"
import {
  ImageBlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import axios from "axios"
import FileType, { FileTypeResult } from "file-type"
import fs from "fs-extra"
import { ListBlockChildrenResponseResult } from "notion-to-md/build/types"

import { makeImagePersistencePlan } from "./MakeImagePersistencePlan"
import { NotionPage } from "./NotionPage"
import { info, logDebug, verbose, warning } from "./log"
import { getImageUrl } from "./notion_objects_utils"
import {
  IDocuNotionContext,
  IDocuNotionContextPageInfo,
  IPlugin,
} from "./plugins/pluginTypes"

// Extracting extension, mime, and buffer data into a separate type called FileData
export type FileData = {
  extension: string
  mime: string
  buffer: Buffer
}

export type OutputPaths = {
  primaryFileOutputPath: string
  filePathToUseInMarkdown: string
}

export type ImageSet = {
  primaryUrl: string
  caption?: string
}

export function updateImageUrlToMarkdownImagePath(
  imageOrCover: ImageBlockObjectResponse["image"] | PageObjectResponse["cover"],
  filePathToUseInMarkdown: string
) {
  if (!imageOrCover) {
    throw Error("Image block not found")
  }
  if ("file" in imageOrCover) {
    imageOrCover.file.url = filePathToUseInMarkdown
  } else {
    imageOrCover.external.url = filePathToUseInMarkdown
  }
}

export async function readPrimaryImage(url: string) {
  // Keep alive with a long timeout solved some image retrieval issues. Maybe we should consider retries with exponential
  // back-offs if this becomes an issue again.
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    httpsAgent: new https.Agent({ keepAlive: true }),
    timeout: 10000,
  })
  const primaryBuffer = Buffer.from(response.data, "utf-8")
  const fileType = await FileType.fromBuffer(primaryBuffer)

  if (!fileType) {
    throw new Error(`Failed to determine file type for image at ${url}`)
  }

  return {
    primaryBuffer,
    fileType,
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

export async function cleanupOldImages(
  imageHandler: ImageHandler
): Promise<void> {
  for (const p of imageHandler.existingImagesNotSeenYetInPull) {
    verbose(`Removing old image: ${p}`)
    await fs.rm(p)
  }
}

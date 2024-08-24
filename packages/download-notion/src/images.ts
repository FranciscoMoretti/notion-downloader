import https from "https"
import * as Path from "path"
import axios from "axios"
import FileType, { FileTypeResult } from "file-type"
import fs from "fs-extra"
import { ListBlockChildrenResponseResult } from "notion-to-md/build/types"

import { makeImagePersistencePlan } from "./MakeImagePersistencePlan"
import { NotionPage } from "./NotionPage"
import { info, logDebug, verbose, warning } from "./log"
import {
  IDocuNotionContext,
  IDocuNotionContextPageInfo,
  IPlugin,
} from "./plugins/pluginTypes"

// we parse a notion image and its caption into what we need, which includes any urls to localized versions
// of the image that may be embedded in the caption.
export type ImageSet = {
  // We get these from parseImageBlock():
  primaryUrl: string
  // caption may contain a caption and/or URLs to localized versions
  caption?: string

  // then we fill this in from processImageBlock():
  pageInfo?: IDocuNotionContextPageInfo

  // then we fill these in readPrimaryImage():
  primaryBuffer?: Buffer
  fileType?: FileTypeResult

  // then we fill these in from makeImagePersistencePlan():
  primaryFileOutputPath?: string
  outputFileName?: string
  filePathToUseInMarkdown?: string
}

// We handle several things here:
// 1) copy images locally instead of leaving them in Notion
// 2) change the links to point here
// 3) read the caption and if there are localized images, get those too
// 4) prepare for localized documents, which need a copy of every image

export class ImageHandler {
  public imagePrefix: string
  public imageOutputPath: string
  public existingImagesNotSeenYetInPull: string[]

  constructor(prefix: string, outputPath: string) {
    this.imagePrefix = prefix.replace(/\/$/, "")
    this.imageOutputPath = outputPath
    this.existingImagesNotSeenYetInPull = []
  }

  public async initImageHandling(): Promise<void> {
    // Currently we don't delete the image directory, because if an image
    // changes, it gets a new id. This way can then prevent downloading
    // and image after the 1st time. The downside is currently we don't
    // have the smarts to remove unused images.
    if (this.imageOutputPath) {
      await fs.mkdir(this.imageOutputPath, { recursive: true })
    }
  }
}

export async function initImageHandling(
  imagePrefix: string,
  imageOutputPath: string
): Promise<ImageHandler> {
  const imageHandler = new ImageHandler(imagePrefix, imageOutputPath)
  await imageHandler.initImageHandling()
  return imageHandler
}

export const standardImageTransformer: IPlugin = {
  name: "DownloadImagesToRepo",
  notionToMarkdownTransforms: [
    {
      type: "image",
      // we have to set this one up for each page because we need to
      // give it two extra parameters that are context for each page
      getStringFromBlock: (
        context: IDocuNotionContext,
        block: ListBlockChildrenResponseResult
      ) => markdownToMDImageTransformer(block, context),
    },
  ],
}

// This is a "custom transformer" function passed to notion-to-markdown
// eslint-disable-next-line @typescript-eslint/require-await
export async function markdownToMDImageTransformer(
  block: ListBlockChildrenResponseResult,
  context: IDocuNotionContext
): Promise<string> {
  const image = (block as any).image

  await processImageBlock(block, context)

  // just concatenate the caption text parts together
  const altText: string = image.caption
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    .map((item: any) => item.plain_text)
    .join("")

  const href: string =
    image.type === "external" ? image.external.url : image.file.url
  return `![${altText}](${href})`
}

async function processImageBlock(
  block: any,
  context: IDocuNotionContext
): Promise<void> {
  const imageBlock = block.image

  // TODOL: Fix ISSUE Getting a "socket hung up" error when getting the image.
  logDebug("processImageBlock", JSON.stringify(imageBlock))

  const imageSet = parseImageBlock(imageBlock)
  imageSet.pageInfo = context.pageInfo

  // enhance: it would much better if we could split the changes to markdown separately from actual reading/writing,
  // so that this wasn't part of the markdown-creation loop. It's already almost there; we just need to
  // save the imageSets somewhere and then do the actual reading/writing later.
  await readPrimaryImage(imageSet)
  makeImagePersistencePlan(
    context.options,
    imageSet,
    block.id,
    context.imageHandler.imageOutputPath,
    context.imageHandler.imagePrefix
  )
  await saveImage(imageSet)

  // change the src to point to our copy of the image
  if ("file" in imageBlock) {
    imageBlock.file.url = imageSet.filePathToUseInMarkdown
  } else {
    imageBlock.external.url = imageSet.filePathToUseInMarkdown
  }
  // put back the simplified caption, stripped of the meta information
  if (imageSet.caption) {
    imageBlock.caption = [
      {
        type: "text",
        text: { content: imageSet.caption, link: null },
        plain_text: imageSet.caption,
      },
    ]
  } else {
    imageBlock.caption = []
  }
}

async function readPrimaryImage(imageSet: ImageSet) {
  // Keep alive with a long timeout solved some image retrieval issues. Maybe we should consider retries with exponential
  // back-offs if this becomes an issue again.
  const response = await axios.get(imageSet.primaryUrl, {
    responseType: "arraybuffer",
    httpsAgent: new https.Agent({ keepAlive: true }),
    timeout: 10000,
  })
  imageSet.primaryBuffer = Buffer.from(response.data, "utf-8")
  imageSet.fileType = await FileType.fromBuffer(imageSet.primaryBuffer)
}

async function saveImage(imageSet: ImageSet): Promise<void> {
  writeImageIfNew(imageSet.primaryFileOutputPath!, imageSet.primaryBuffer!)
}

function writeImageIfNew(path: string, buffer: Buffer) {
  imageWasSeen(path)

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
  const writeStream = fs.createWriteStream(path)
  writeStream.write(buffer) // async but we're not waiting
  writeStream.end()
}

export function parseImageBlock(image: any): ImageSet {
  const imageSet: ImageSet = {
    primaryUrl: "",
    caption: "",
  }

  if ("file" in image) {
    imageSet.primaryUrl = image.file.url
  } else {
    imageSet.primaryUrl = image.external.url
  }

  // Keep the caption as-is
  imageSet.caption = image.caption.map((c: any) => c.plain_text).join("")

  return imageSet
}

export function parseCover(page: NotionPage): ImageSet | undefined {
  const cover = page.metadata.cover
  if (!cover) return undefined

  const imageSet: ImageSet = {
    primaryUrl: cover["type"] === "file" ? cover.file.url : cover.external.url,
    caption: "",
  }
  return imageSet
}

export async function processCoverImage(
  page: NotionPage,
  context: IDocuNotionContext
): Promise<void> {
  const cover = page.metadata.cover
  if (!cover) return undefined
  logDebug("processCoverImage for page: ", page.id)
  const imageSet = parseCover(page)
  if (!imageSet) return
  imageSet.pageInfo = context.pageInfo
  await readPrimaryImage(imageSet)

  // TODO: Include here the NamingStrategy
  makeImagePersistencePlan(
    context.options,
    imageSet,
    page.id,
    context.imageHandler.imageOutputPath,
    context.imageHandler.imagePrefix
  )
  await saveImage(imageSet)

  // TODO: Do this a bit less hacky. Now it modified the cover object in the page object. It should draw from FilesMap

  if (!imageSet.filePathToUseInMarkdown) {
    // At this point, filePathToUseInMarkdown should be defined.
    throw new Error("filePathToUseInMarkdown is undefined")
  }
  // change the src to point to our copy of the image
  if ("file" in cover) {
    cover.file.url = imageSet.filePathToUseInMarkdown
  } else {
    cover.external.url = imageSet.filePathToUseInMarkdown
  }
}

function imageWasSeen(path: string) {
  // TODO: Fix this. For now we mock it returning true.
  return true
  const imageHandler = context.imageHandler
  imageHandler.existingImagesNotSeenYetInPull =
    imageHandler.existingImagesNotSeenYetInPull.filter((p) => p !== path)
}

export async function cleanupOldImages(
  imageHandler: ImageHandler
): Promise<void> {
  for (const p of imageHandler.existingImagesNotSeenYetInPull) {
    verbose(`Removing old image: ${p}`)
    await fs.rm(p)
  }
}

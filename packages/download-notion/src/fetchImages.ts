import path from "path"
import { NotionObjectTree } from "notion-downloader"

import { FilesMap } from "./files/FilesMap"
import { readFile, saveFileBuffer } from "./notionObjects/fileBufferUtils"
import { NotionImageLike } from "./notionObjects/objectTypes"
import { applyToAllImages } from "./processImages"

export async function fetchImages(
  objectsTree: NotionObjectTree,
  outputDir: string,
  imagesCacheFilesMap: FilesMap
) {
  await applyToAllImages({
    objectsTree,
    applyToImage: async (image) => {
      if (imagesCacheFilesMap.exists("image", image.id)) {
        const imageRecord = imagesCacheFilesMap.get("image", image.id)
        if (imageRecord.lastEditedTime === image.lastEditedTime) {
          return
        }
      }
      await fetchImageAndSaveToCache(image, outputDir, imagesCacheFilesMap)
    },
  })
}
async function fetchImageAndSaveToCache(
  image: NotionImageLike,
  outputDir: string,
  imagesCacheFilesMap: FilesMap
) {
  const imageData = await readFile(image.url, "url")
  const imagePath = path.join(
    outputDir,
    `${image.id}.${imageData.fileType.ext}`
  )
  await saveFileBuffer(imageData, imagePath)
  imagesCacheFilesMap.set("image", image.id, {
    path: imagePath,
    lastEditedTime: image.lastEditedTime,
  })
}

import path from "path"
import { NotionObjectTree } from "notion-downloader"

import { AssetType, FilesMap } from "./files/FilesMap"
import { readFile, saveFileBuffer } from "./notionObjects/fileBufferUtils"
import { NotionImageLike } from "./notionObjects/objectTypes"
import { applyToAllImages } from "./objectTree/applyToImages"

export async function fetchImages(
  objectsTree: NotionObjectTree,
  assetsType: AssetType,
  outputDir: string,
  imagesCacheFilesMap: FilesMap
) {
  const assetTypeCacheDir = path.join(outputDir, assetsType)

  await applyToAllImages({
    objectsTree,
    applyToImage: async (image) => {
      if (imagesCacheFilesMap.exists(assetsType, image.id)) {
        const imageRecord = imagesCacheFilesMap.get(assetsType, image.id)
        if (imageRecord.lastEditedTime === image.lastEditedTime) {
          return
        }
      }
      await fetchImageAndSaveToCache(
        image,
        assetTypeCacheDir,
        imagesCacheFilesMap
      )
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

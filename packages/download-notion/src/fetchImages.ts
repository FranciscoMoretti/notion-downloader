import path from "path"
import { NotionObjectTree } from "notion-downloader"

import { FilesMap } from "./FilesMap"
import { NotionImage } from "./NotionImage"
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
  image: NotionImage,
  outputDir: string,
  imagesCacheFilesMap: FilesMap
) {
  const imageData = await image.download()
  const imagePath = path.join(outputDir, `${image.id}.${imageData.extension}`)
  await image.save(imagePath)
  imagesCacheFilesMap.set("image", image.id, {
    path: imagePath,
    lastEditedTime: image.lastEditedTime,
  })
}

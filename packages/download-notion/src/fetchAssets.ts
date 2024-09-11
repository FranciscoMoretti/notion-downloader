import path from "path"
import { NotionObjectTree } from "notion-downloader"

import { AssetType, FilesMap } from "./files/FilesMap"
import { readFile, saveFileBuffer } from "./notionObjects/fileBufferUtils"
import { iNotionAssetObject } from "./notionObjects/objectTypes"
import { applyToAllAssets } from "./objectTree/applyToImages"

export async function fetchAssets(
  objectsTree: NotionObjectTree,
  assetTypes: AssetType[],
  outputDir: string,
  assetsCacheFilesMap: FilesMap
) {
  await applyToAllAssets({
    objectsTree,
    applyToAsset: async (asset) => {
      const assetTypeCacheDir = path.join(outputDir, asset.assetType)
      if (assetsCacheFilesMap.exists(asset.assetType, asset.id)) {
        const assetFileRecord = assetsCacheFilesMap.get(
          asset.assetType,
          asset.id
        )
        if (assetFileRecord.lastEditedTime === asset.lastEditedTime) {
          return
        }
      }
      await fetchAssetAndSaveToCache(
        asset,
        assetTypeCacheDir,
        assetsCacheFilesMap
      )
    },
    assetTypes,
  })
}
async function fetchAssetAndSaveToCache(
  asset: iNotionAssetObject,
  outputDir: string,
  assetsCacheFilesMap: FilesMap
) {
  const assetData = await readFile(asset.url, "url")
  const assetPath = path.join(
    outputDir,
    `${asset.id}.${assetData.fileType.ext}`
  )
  await saveFileBuffer(assetData, assetPath)
  assetsCacheFilesMap.set(asset.assetType, asset.id, {
    path: assetPath,
    lastEditedTime: asset.lastEditedTime,
  })
}

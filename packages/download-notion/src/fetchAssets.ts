import path from "path"
import { NotionObjectTree } from "notion-tree"

import { AssetType } from "./config/schema"
import { FilesMap } from "./files/FilesMap"
import { readFile, saveFileBuffer } from "./notionObjects/fileBufferUtils"
import { iNotionAssetObject } from "./notionObjects/objectTypes"
import { applyToAllAssets } from "./objectTree/applyToAssets"

export async function preFetchAssets(
  objectsTree: NotionObjectTree,
  outputDir: string,
  assetsCacheFilesMap: FilesMap,
  assetTypes: AssetType[] = [
    AssetType.enum.image,
    AssetType.enum.video,
    AssetType.enum.audio,
    AssetType.enum.file,
    AssetType.enum.pdf,
  ]
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

import { NotionObjectTree } from "notion-downloader"

import { AssetType } from "../config/schema"
import { NotionBlockImage } from "../notionObjects/NotionBlockImage"
import { NotionCoverImage } from "../notionObjects/NotionCoverImage"
import { NotionFileObject } from "../notionObjects/NotionFileObject"
import {
  NotionImageLike,
  iNotionAssetObject,
} from "../notionObjects/objectTypes"
import { databaseHasCover, pageHasCover } from "../notionObjects/objectutils"

export async function applyToAllAssets({
  objectsTree,
  applyToAsset,
  assetTypes = [
    AssetType.Image,
    AssetType.Video,
    AssetType.Audio,
    AssetType.File,
    AssetType.PDF,
  ],
}: {
  objectsTree: NotionObjectTree
  applyToAsset: (asset: iNotionAssetObject) => Promise<void>
  assetTypes?: AssetType[]
}) {
  const promises: Promise<void>[] = []

  if (assetTypes.includes(AssetType.Image)) {
    promises.push(
      ...objectsTree.getBlocks(AssetType.Image).map((block) => {
        const image = new NotionBlockImage(block)
        return applyToAsset(image)
      })
    )

    promises.push(
      ...objectsTree
        .getPages()
        .filter(pageHasCover)
        .map((pageResponse) => {
          const image = new NotionCoverImage(pageResponse)
          return applyToAsset(image)
        })
    )

    promises.push(
      ...objectsTree
        .getDatabases()
        .filter(databaseHasCover)
        .map((databaseResponse) => {
          const image = new NotionCoverImage(databaseResponse)
          return applyToAsset(image)
        })
    )
  }

  const assetsExceptImage = assetTypes.filter(
    (type) => type !== AssetType.Image
  )
  for (const assetType of assetsExceptImage) {
    promises.push(
      ...objectsTree.getBlocks(assetType).map((file) => {
        const fileObject = new NotionFileObject(file)
        return applyToAsset(fileObject)
      })
    )
  }

  await Promise.all(promises)
}

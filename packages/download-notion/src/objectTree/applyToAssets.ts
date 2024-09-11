import { NotionObjectTree } from "notion-downloader"

import { AssetType } from "../files/FilesMap"
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
  assetTypes = ["image"],
}: {
  objectsTree: NotionObjectTree
  applyToAsset: (asset: iNotionAssetObject) => Promise<void>
  assetTypes?: AssetType[]
}) {
  const promises: Promise<void>[] = []

  if (assetTypes.includes("image")) {
    promises.push(
      ...objectsTree.getBlocks("image").map((block) => {
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

  // TODO: Create a for loop to go over all asset types (except image)
  if (assetTypes.includes("file")) {
    promises.push(
      ...objectsTree.getBlocks("file").map((file) => {
        const fileObject = new NotionFileObject(file)
        return applyToAsset(fileObject)
      })
    )
  }

  await Promise.all(promises)
}

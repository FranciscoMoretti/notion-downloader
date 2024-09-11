import { NotionObjectTree } from "notion-downloader"

import { AssetType } from "../files/FilesMap"
import { NotionBlockImage } from "../notionObjects/NotionBlockImage"
import { NotionCoverImage } from "../notionObjects/NotionCoverImage"
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

  await Promise.all(promises)
}

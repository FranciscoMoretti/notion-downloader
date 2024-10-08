import { NotionObjectTree } from "notion-tree"

import { AssetType } from "../config/schema"
import { NotionBlockImage } from "../notionObjects/NotionBlockImage"
import { NotionCoverImage } from "../notionObjects/NotionCoverImage"
import { NotionFileObject } from "../notionObjects/NotionFileObject"
import { iNotionAssetObject } from "../notionObjects/objectTypes"
import {
  databaseHasCover,
  notionObjectHasExternalFile,
  pageHasCover,
} from "../notionObjects/objectutils"

export async function applyToAllAssets({
  objectsTree,
  applyToAsset,
  assetTypes = [
    AssetType.enum.image,
    AssetType.enum.video,
    AssetType.enum.audio,
    AssetType.enum.file,
    AssetType.enum.pdf,
  ],
}: {
  objectsTree: NotionObjectTree
  applyToAsset: (asset: iNotionAssetObject) => Promise<void>
  assetTypes?: AssetType[]
}) {
  const promises: Promise<void>[] = []

  if (assetTypes.includes(AssetType.enum.image)) {
    promises.push(
      ...objectsTree
        .getBlocks(AssetType.enum.image)
        // TODO: Consider downloading external images toggled by a setting
        .filter((block) => !notionObjectHasExternalFile(block))
        .map((block) => {
          const image = new NotionBlockImage(block)
          return applyToAsset(image)
        })
    )

    promises.push(
      ...objectsTree
        .getPages()
        .filter(pageHasCover)
        .filter((pageResponse) => !notionObjectHasExternalFile(pageResponse))
        .map((pageResponse) => {
          const image = new NotionCoverImage(pageResponse)
          return applyToAsset(image)
        })
    )

    promises.push(
      ...objectsTree
        .getDatabases()
        .filter(databaseHasCover)
        .filter(
          (databaseResponse) => !notionObjectHasExternalFile(databaseResponse)
        )
        .map((databaseResponse) => {
          const image = new NotionCoverImage(databaseResponse)
          return applyToAsset(image)
        })
    )
  }

  const assetsExceptImage = assetTypes.filter(
    (type) => type !== AssetType.enum.image
  )
  for (const assetType of assetsExceptImage) {
    promises.push(
      ...objectsTree
        .getBlocks(assetType)
        .filter((block) => !notionObjectHasExternalFile(block))
        .map((file) => {
          const fileObject = new NotionFileObject(file)
          return applyToAsset(fileObject)
        })
    )
  }

  await Promise.all(promises)
}

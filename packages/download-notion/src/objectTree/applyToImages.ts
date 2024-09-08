import { NotionObjectTree } from "notion-downloader"

import { NotionBlockImage } from "../notionObjects/NotionBlockImage"
import { NotionCoverImage } from "../notionObjects/NotionCoverImage"
import { NotionImageLike } from "../notionObjects/objectTypes"
import { databaseHasCover, pageHasCover } from "../notionObjects/objectutils"

export async function applyToAllImages({
  objectsTree,
  applyToImage,
}: {
  objectsTree: NotionObjectTree
  applyToImage: (image: NotionImageLike) => Promise<void>
}) {
  const promises: Promise<void>[] = []

  promises.push(
    ...objectsTree.getBlocks("image").map((block) => {
      const image = new NotionBlockImage(block)
      return applyToImage(image)
    })
  )

  promises.push(
    ...objectsTree
      .getPages()
      .filter(pageHasCover)
      .map((pageResponse) => {
        const image = new NotionCoverImage(pageResponse)
        return applyToImage(image)
      })
  )

  promises.push(
    ...objectsTree
      .getDatabases()
      .filter(databaseHasCover)
      .map((databaseResponse) => {
        const image = new NotionCoverImage(databaseResponse)
        return applyToImage(image)
      })
  )

  await Promise.all(promises)
}

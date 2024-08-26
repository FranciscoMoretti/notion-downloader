import { ImageNamingStrategy } from "./ImageNamingStrategy"
import { NotionPullOptions } from "./config/schema"
import { getImageFileExtension } from "./getImageFileExtension"
import { FileData, ImageSet } from "./images"
import { findLastUuid, hashOfString } from "./utils"

// Original behavior and comment:
//   Since most images come from pasting screenshots, there isn't normally a filename. That's fine, we just make a hash of the url
//   Images that are stored by notion come to us with a complex url that changes over time, so we pick out the UUID that doesn't change. Example:
//      https://s3.us-west-2.amazonaws.com/secure.notion-static.com/d1058f46-4d2f-4292-8388-4ad393383439/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20220516%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20220516T233630Z&X-Amz-Expires=3600&X-Amz-Signature=f215704094fcc884d37073b0b108cf6d1c9da9b7d57a898da38bc30c30b4c4b5&X-Amz-SignedHeaders=host&x-id=GetObject
//   But around Sept 2023, they changed the url to be something like:
//      https://prod-files-secure.s3.us-west-2.amazonaws.com/d9a2b712-cf69-4bd6-9d65-87a4ceeacca2/d1bcdc8c-b065-4e40-9a11-392aabeb220e/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230915%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230915T161258Z&X-Amz-Expires=3600&X-Amz-Signature=28fca48e65fba86d539c3c4b7676fce1fa0857aa194f7b33dd4a468ecca6ab24&X-Amz-SignedHeaders=host&x-id=GetObject
//   The thing we want is the last UUID before the ?

export class LegacyImageNamingStrategy implements ImageNamingStrategy {
  getFileName(
    imageSet: ImageSet,
    fileData: FileData,
    imageBlockId: string,
    ancestorPageName?: string
  ): string {
    const urlBeforeQuery = imageSet.primaryUrl.split("?")[0]
    const thingToHash = findLastUuid(urlBeforeQuery) ?? urlBeforeQuery
    const hash = hashOfString(thingToHash)
    return `${hash}.${getImageFileExtension(fileData, urlBeforeQuery)}`
  }
}

import {
  ImageBlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

export function getImageBlockUrl(
  image: ImageBlockObjectResponse["image"]
): string {
  return image.type === "external" ? image.external.url : image.file.url
}
export function getPageCoverUrl(
  cover: NonNullable<PageObjectResponse["cover"]>
): string {
  return cover["type"] === "file" ? cover.file.url : cover.external.url
}

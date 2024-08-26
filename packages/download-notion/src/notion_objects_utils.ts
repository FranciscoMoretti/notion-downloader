import {
  ImageBlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

export function getImageUrl(
  image:
    | ImageBlockObjectResponse["image"]
    | NonNullable<PageObjectResponse["cover"]>
): string {
  return image.type === "external" ? image.external.url : image.file.url
}

// Format is page slug (if there is one) followed by the image block ID from Notion.
// The image block ID will remain stable as long as any changes to the image are done
// using the Replace feature. Also, image blocks can be moved using the Move To feature.
// The block ID is a unique GUID and thus provides a unique file name.

export function getImageFileExtension(url: string, extension?: string): string {
  if (extension) {
    return extension
  }

  const urlExtension = url.split(".").pop()?.toLowerCase()
  if (
    urlExtension &&
    ["png", "jpg", "jpeg", "gif", "webp"].includes(urlExtension)
  ) {
    return urlExtension
  }
  return "png"
}

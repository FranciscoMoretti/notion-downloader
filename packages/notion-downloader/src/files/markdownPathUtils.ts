export function convertMarkdownPath(path: string): string {
  const posixPath = path.replace(/\\/g, "/")
  // TODO: Ensure it's only encoded once by figuring out where the naming strategy gets applied in FilesManager get method
  // IF not already url encoded, encode it
  if (!posixPath.includes("%")) {
    return encodeURI(posixPath)
  }
  return posixPath
}

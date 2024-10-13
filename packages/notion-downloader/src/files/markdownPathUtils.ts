export function convertMarkdownPath(path: string): string {
  const posixPath = path.replace(/\\/g, "/")
  return encodeURI(posixPath)
}

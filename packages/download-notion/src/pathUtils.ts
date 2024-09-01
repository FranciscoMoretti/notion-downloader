import path from "path"

export function addPathPrefix(basePath: string, prefix: string): string {
  if (prefix === "") {
    return basePath
  }
  const normalizedPrefix = path.normalize(prefix)
  const normalizedPath = path.normalize(basePath)

  // If the path is already absolute, add the prefix anyway
  // e.g. /foo/bar and prefix /prefix will result in /prefix/foo/bar
  const newPath = path.join(normalizedPrefix, normalizedPath)

  return newPath
}

export function removePathPrefix(fullPath: string, prefix: string): string {
  if (prefix === "") {
    return fullPath
  }

  const normalizedFullPath = path.normalize(fullPath)
  const normalizedPrefix = path.normalize(prefix)

  if (!normalizedFullPath.startsWith(normalizedPrefix)) {
    throw new Error("Path does not start with the given prefix")
  }

  let result = normalizedFullPath.slice(normalizedPrefix.length)

  // If the result is empty, return an empty string
  if (result === "") {
    return ""
  }

  // Ensure the result starts with a separator if the original path was absolute
  if (path.isAbsolute(fullPath) && !result.startsWith(path.sep)) {
    result = path.sep + result
  }

  return result
}

export function removePathExtension(convertedLink: string) {
  // Returns a normalized path with the extension removed
  const parsedPath = path.parse(convertedLink)
  convertedLink = path.join(parsedPath.dir, parsedPath.name)
  return convertedLink
}

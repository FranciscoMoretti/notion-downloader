import * as Path from "path"

import { NotionPullOptions } from "./config/schema"
import { FileData, ImageSet, OutputPaths } from "./images"

export interface PathStrategyOptions {
  pathPrefix?: string
}

export class PathStrategy {
  private pathPrefix: string

  constructor(options: PathStrategyOptions = {}) {
    this.pathPrefix = options.pathPrefix || ""
  }

  getPath(filename: string): string {
    const decodedFilename = decodeURI(filename)
    return Path.posix.join(this.pathPrefix, decodedFilename)
  }
}

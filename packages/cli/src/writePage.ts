import * as Path from "path"
import fs from "fs-extra"

import { verbose } from "./log"
import { counts } from "./notionPull"

export function writePage(finalMarkdown: string, mdPath: string) {
  verbose(`writing ${mdPath}`)
  // TODO: Move directory creation to a previous step to avoid repetition in creating directories
  fs.mkdirSync(Path.dirname(mdPath), { recursive: true })
  fs.writeFileSync(mdPath, finalMarkdown, {})
  ++counts.output_normally
}

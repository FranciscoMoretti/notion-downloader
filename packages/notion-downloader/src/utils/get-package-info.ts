import path from "path"
import { fileURLToPath } from "url"
import fs from "fs-extra"
import { type PackageJson } from "type-fest"

export function getPackageInfo() {
  let packageJsonPath: string
  if (typeof __dirname !== "undefined") {
    // CommonJS
    packageJsonPath = path.resolve(__dirname, "..", "package.json")
  } else {
    // ESM
    // TODO: Fix, this gives a warning for CJS. Maybe its a sign to drop support for CJS?
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    packageJsonPath = path.resolve(__dirname, "..", "..", "package.json")
  }

  return fs.readJSONSync(packageJsonPath) as PackageJson
}

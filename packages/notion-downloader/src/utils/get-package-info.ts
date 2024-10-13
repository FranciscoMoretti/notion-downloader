import path from "path"
import { fileURLToPath } from "url"
import fs from "fs-extra"
import { type PackageJson } from "type-fest"

export function getPackageInfo() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const packageJsonPath = path.resolve(__dirname, "..", "package.json")

  return fs.readJSONSync(packageJsonPath) as PackageJson
}

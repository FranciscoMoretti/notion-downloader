#!/usr/bin/env node
import { cleanup } from "@/src/commands/cleanup"
import { init } from "@/src/commands/init"
import { pull } from "@/src/commands/pull"
import { Command } from "commander"

import { NotionPullOptions, NotionPullOptionsInput } from "./config/schema"
import { getPackageInfo } from "./utils/get-package-info"

process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

export { NotionPullOptionsInput as Config }

async function main() {
  const packageInfo = await getPackageInfo()

  const program = new Command()
    .name("notion-downloader")
    .description("Download your Notion data, pages and assets")
    .version(
      packageInfo.version || "1.0.0",
      "-v, --version",
      "display the version number"
    )

  program.addCommand(init).addCommand(pull).addCommand(cleanup)

  program.parse()
}

main()

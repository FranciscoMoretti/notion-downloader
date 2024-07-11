#!/usr/bin/env node
import { diff } from "@/src/commands/diff"
import { init } from "@/src/commands/init"
import { pull } from "@/src/commands/pull"
import { Command } from "commander"

import { getPackageInfo } from "./utils/get-package-info"

process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

async function main() {
  const packageInfo = await getPackageInfo()

  const program = new Command()
    .name("shadcn-ui")
    .description("add components and dependencies to your project")
    .version(
      packageInfo.version || "1.0.0",
      "-v, --version",
      "display the version number"
    )

  program.addCommand(init).addCommand(diff).addCommand(pull)

  program.parse()
}

main()

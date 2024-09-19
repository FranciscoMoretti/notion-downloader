import { existsSync } from "fs"
import fs from "fs/promises"
import path from "path"
import { Command } from "commander"
import prompts from "prompts"
import { z } from "zod"

import { defaultPullOptionsSchema, pullOptionsSchema } from "../config/schema"
import { FilesCleaner } from "../files/FilesCleaner"
import { FilesManager } from "../files/FilesManager"
import { loadFilesManagerFile } from "../files/saveLoadUtils"
import { getConfig } from "../utils_old/get-config"
import { logger } from "../utils_old/logger"

const cleanupOptionsSchema = z.object({
  cwd: z.string(),
  yes: z.boolean(),
  outputOnly: z.boolean(),
})

export const cleanup = new Command()
  .name("cleanup")
  .description("Remove all downloaded files and cache")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option(
    "-o, --output-only",
    "only clean output files and remove the filesmap files.",
    false
  )
  .action(async (opts) => {
    const options = cleanupOptionsSchema.parse(opts)
    const cwd = path.resolve(options.cwd)

    // Ensure target directory exists.
    if (!existsSync(cwd)) {
      logger.error(`The path ${cwd} does not exist. Please try again.`)
      process.exit(1)
    }

    const config = await getConfig(cwd)
    if (!config) {
      console.error("Configuration not found.")
      process.exit(1)
    }
    const pullOptions = defaultPullOptionsSchema.parse(config)

    const cacheDir = pullOptions.cache.cacheDirectory
    const outputFilesMapPath = path.join(cacheDir, "output_filesmap.json")
    const filesManager = loadFilesManagerFile(outputFilesMapPath)

    const confirm =
      options.yes ||
      (await prompts(
        [
          {
            type: "confirm",
            name: "confirm",
            message: "Are you sure you want to delete all files?",
          },
        ],
        {
          onCancel: () => {
            console.log("Cleanup cancelled.")
            process.exit(0)
          },
        }
      ))

    if (!confirm) return
    if (filesManager) {
      const filesCleaner = new FilesCleaner()
      await filesCleaner.cleanupAllFiles(filesManager)
    }
    if (options.outputOnly) {
      await fs.rm(outputFilesMapPath)
    } else {
      await fs.rm(cacheDir, { recursive: true })
    }
    console.log("All files and cache directory have been removed.")
  })

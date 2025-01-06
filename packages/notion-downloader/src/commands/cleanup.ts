import { existsSync } from "fs"
import fs from "fs/promises"
import path from "path"
import { Command } from "commander"
import prompts from "prompts"
import { z } from "zod"

import { defaultPullOptionsSchema, pullOptionsSchema } from "../config/schema"
import { FilesCleaner } from "../files/FilesCleaner"
import { loadFilesManagerFile } from "../files/saveLoadUtils"
import { getConfig } from "../utils/get-config"
import { handleError } from "../utils/handle-error"
import { logger } from "../utils/logger"

const cleanupOptionsSchema = z.object({
  cwd: z.string(),
  yes: z.boolean(),
  outputOnly: z.boolean(),
})

export const cleanup = new Command()
  .name("cleanup")
  .description("Remove all downloaded files and cache")
  .option("-y, --yes", "skip confirmation prompts", false)
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
      handleError(`The path ${cwd} does not exist. Please try again.`)
    }

    // TODO: Optionally delete conversion but not the cache
    const config = await getConfig(cwd)
    if (!config) {
      handleError("Configuration not found.")
    }
    const pullOptions = defaultPullOptionsSchema.parse(config)

    const cacheDir = pullOptions.cache.cacheDirectory
    const outputFilesMapPath = path.join(cacheDir, "output_filesmap.json")

    // Handle output files cleanup
    if (existsSync(outputFilesMapPath)) {
      const filesManager = loadFilesManagerFile(outputFilesMapPath)
      const confirmOutput = options.yes || await prompts(
        [{
          type: "confirm",
          name: "value",
          message: "Do you want to clean up all output files?",
          initial: true
        }],
        {
          onCancel: () => {
            logger.info("Skipping output files cleanup.")
            return { value: false }
          },
        }
      )

      if ((typeof confirmOutput === 'boolean' ? confirmOutput : confirmOutput.value)) {
        if (filesManager) {
          const filesCleaner = new FilesCleaner()
          await filesCleaner.cleanupAllFiles(filesManager)
        }
        await fs.rm(outputFilesMapPath)
        logger.info("Output files cleaned up.")
      } else {
        logger.info("Skipping cleanup of output files.")
      }
    } else {
      logger.info("Output filesmap not found. Skipping cleanup of output files.")
    }
    
    // Handle cache cleanup if not output-only
    if (!options.outputOnly) {
        const confirmCache = options.yes || await prompts(
        [{
          type: "confirm",
          name: "value",
          message: "Do you want to clean up the cache directory?",
          initial: true

        }],
        {
          onCancel: () => {
            console.log("Cleanup cancelled.")
            process.exit(0)
          },
        }
      )

      if ((typeof confirmCache === 'boolean' ? confirmCache : confirmCache.value)) {
        logger.info("Cleaning up cache directory...")
        await fs.rm(cacheDir, { recursive: true })
        logger.info("Cache directory cleaned up.")
      }
    } else {
      logger.info("Skipping cache directory cleanup.")
    }

    logger.info("Cleanup complete.")
  })

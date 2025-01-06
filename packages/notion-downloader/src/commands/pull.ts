import { existsSync, promises as fs } from "fs"
import path from "path"
import { DEFAULT_CONFIG_FILENAME, getConfig } from "@/src/utils/get-config"
import { handleError } from "@/src/utils/handle-error"
import { logger } from "@/src/utils/logger"
import chalk from "chalk"
import { Command, Option } from "commander"
import dotenv from "dotenv"

import "dotenv/config"
import ora from "ora"
import prompts from "prompts"
import { z } from "zod"

import { pullOptionsSchema } from "../config/schema"
import { setLogLevel } from "../log"
import { notionContinuosPull } from "../notionPull"

// Read from .env, .env.local, .env.development, .env.development.local
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') })

export const pull = new Command()
  .name("pull")
  .description("pull pages from notion")
  .option(
    "-n, --notion-token <string>",
    "notion api token, which looks like secret_3bc1b50XFYb15123RHF243x43450XFY33250XFYa343"
  )
  .option(
    "-r, --root-page <string>",
    "The 31 character ID of the page which is the root of your docs page in notion. The code will look like 9120ec9960244ead80fa2ef4bc1bba25. This page must have a child page named 'Outline'"
  )
  .option(
    "-d, --root-is-db",
    "Whether the root page is a database. If not, it must be a 'page'." +
      // TODO: These options default override the ones from the config file. Figure out how to integrate cosmiconfig and commander
      " Default: false"
  )
  // TODO: Consider relying more on config than on options.
  // .option(
  //   "-m, --markdown-output-path  <string>",
  //   "Root of the hierarchy for md files. WARNING: docu-notion will delete files from this directory. Note also that if it finds localized images, it will create an i18n/ directory as a sibling." +
  //     " Default: ./docs"
  // )
  // .option(
  //   "-t, --status-tag  <string>",
  //   "Database pages without a Notion page property 'status' matching this will be ignored. Use '*' to ignore status altogether." +
  //     " Default: Publish"
  // )
  // TODO: Move this option into a group, and then insert in the `cache` group in the schema.
  .option(
    "-c, --clean-cache",
    "Clear the cache before starting. WARNING: this will remove all files from the cache directory." +
      " Default: false"
  )
  .addOption(
    new Option("-l, --log-level <level>", "Log level").choices([
      "info",
      "verbose",
      "debug",
    ])
  )
  .option("-o, --overwrite", "overwrite existing files. Default: false")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option(
    "-p, --revalidate-period <period>",
    "The period (in milliseconds) at which to revalidate the cache. Default: -1 (disabled)"
  )
  .action(async (opts) => {
    try {
      // Validate the cwd option with zod
      const cwdSchema = z.string()
      cwdSchema.parse(opts.cwd)
      // Ensure target directory exists.
      const cwd = path.resolve(opts.cwd)
      if (!existsSync(cwd)) {
        handleError(`The path ${cwd} does not exist. Please try again.`)
      }

      const config = await getConfig(cwd)
      if (!config) {
        handleError(
          `Configuration is missing. Please run ${chalk.green(
            `init`
          )} to create a ${DEFAULT_CONFIG_FILENAME} file.`
        )
      }
      // Prefer options to config, and config to env vars
      const mergedOptions = {
        ...config,
        ...opts,
        // Get secrets from .env if they exist
        // TODO: Decide if notion token should be in config file or not
        notionToken:
          opts.notionToken || config.notionToken || process.env.NOTION_TOKEN,
        rootId: opts.rootId || config.rootId || process.env.NOTION_ROOT_ID,
      }

      const options = pullOptionsSchema.parse(mergedOptions)

      setLogLevel(mergedOptions.logLevel)

      // pull and convert
      const spinner = ora(`Pulling pages...`).start()

      await notionContinuosPull(options).then(() =>
        console.log("docu-notion Finished.")
      )

      spinner.succeed(`Done.`)
    } catch (error) {
      handleError(error)
    }
  })

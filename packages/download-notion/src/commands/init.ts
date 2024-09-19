import { existsSync, promises as fs } from "fs"
import path from "path"
import {
  DEFAULT_COMPONENTS,
  DEFAULT_CONFIG_FILENAME,
  DEFAULT_TAILWIND_CONFIG,
  DEFAULT_TAILWIND_CSS,
  DEFAULT_UTILS,
  configSchema,
  getConfig,
  resolveConfigPaths,
  type Config,
} from "@/src/utils_old/get-config"
import { handleError } from "@/src/utils_old/handle-error"
import { logger } from "@/src/utils_old/logger"
import * as templates from "@/src/utils_old/templates"
import chalk from "chalk"
import { Command } from "commander"
import template from "lodash.template"
import { cacheStrategiesSchema } from "notion-downloader"
import ora from "ora"
import prompts from "prompts"
import { z } from "zod"

import {
  defaultOptionsSchema,
  defaultPullOptions,
  pullOptionsSchema,
  rootObjectTypeSchema,
} from "../config/schema"

const initOptionsSchema = z.object({
  cwd: z.string(),
  yes: z.boolean(),
  defaults: z.boolean(),
})

export const init = new Command()
  .name("init")
  .description("initialize your project and install dependencies")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-d, --defaults,", "use default configuration.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (opts) => {
    try {
      const options = initOptionsSchema.parse(opts)
      const cwd = path.resolve(options.cwd)

      // Ensure target directory exists.
      if (!existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`)
        process.exit(1)
      }

      const existingConfig = await getConfig(cwd)
      if (existingConfig) {
        logger.info(
          `Configuration files already exist in directory ${cwd}. This operation will have no effect.`
        )
      } else {
        // Read config.
        const config = await promptForConfig(cwd, options.yes)
        // Write to file. (move to init)

        if (!options.yes) {
          const { proceed } = await prompts({
            type: "confirm",
            name: "proceed",
            message: `Write configuration to ${chalk.green(
              DEFAULT_CONFIG_FILENAME
            )}. Proceed?`,
            initial: true,
          })

          if (!proceed) {
            process.exit(0)
          }
        }
        logger.info("")
        const spinner = ora(`Writing ${DEFAULT_CONFIG_FILENAME}...`).start()
        const targetPath = path.resolve(cwd, DEFAULT_CONFIG_FILENAME)
        await fs.writeFile(targetPath, JSON.stringify(config, null, 2), "utf8")
        spinner.succeed()

        await runInit(cwd, config)
      }

      logger.info("")
      logger.info(
        `${chalk.green(
          "Success!"
        )} Project initialization completed. You may now run ${chalk.green(
          "download-notion-cli pull"
        )} to download your Notion content.`
      )
      logger.info("")
    } catch (error) {
      handleError(error)
    }
  })

export async function promptForConfig(cwd: string, skip = false) {
  const defaultConfig = defaultPullOptions
  const highlight = (text: string) => chalk.cyan(text)

  const options = await prompts([
    {
      type: "toggle",
      name: "skipConversion",
      message: `Would you to ${highlight(
        "skip convertion to markdown"
      )} (recommended)?`,
      initial: defaultConfig.conversion.skip,
      active: "yes",
      inactive: "no",
    },
    {
      type: "select",
      name: "cacheStrategy",
      message: `Which ${highlight("cache strategy")} would you like to use?`,
      choices: cacheStrategiesSchema.options.map((cacheStrategy) => ({
        title: cacheStrategy,
        value: cacheStrategy,
      })),
    },
    {
      type: "select",
      name: "rootObjectType",
      message: `What is the ${highlight(
        "root object type"
      )} of your Notion content?`,
      choices: rootObjectTypeSchema.options.map((type) => ({
        title: type,
        value: type,
      })),
    },
    {
      type: "text",
      name: "rootId",
      message: `What is the ${highlight("root ID")} of your Notion content?`,
      initial: defaultConfig?.rootId ?? "",
    },
    // TODO: Complete the rest of the options
  ])

  const config = configSchema.parse({
    // TODO: Set a schema $schema: "https://ui.shadcn.com/schema.json",
    rootId: options.rootId,
    rootObjectType: options.rootObjectType,
    cache: {
      cacheStrategy: options.cacheStrategy,
    },
    conversion: {
      skip: options.skipConversion,
    },
  })

  return await resolveConfigPaths(cwd, config)
}

export async function runInit(cwd: string, config: Config) {
  const spinner = ora(`Initializing project...`)?.start()

  spinner?.succeed()

  // TODO: Implement init to create a config file. Consider spinner at the end
  return

  // Ensure all resolved paths directories exist.
  for (const [key, resolvedPath] of Object.entries(config.resolvedPaths)) {
    // Determine if the path is a file or directory.
    // TODO: is there a better way to do this?
    let dirname = path.extname(resolvedPath)
      ? path.dirname(resolvedPath)
      : resolvedPath

    // If the utils alias is set to something like "@/lib/utils",
    // assume this is a file and remove the "utils" file name.
    // TODO: In future releases we should add support for individual utils.
    if (key === "utils" && resolvedPath.endsWith("/utils")) {
      // Remove /utils at the end.
      dirname = dirname.replace(/\/utils$/, "")
    }

    if (!existsSync(dirname)) {
      await fs.mkdir(dirname, { recursive: true })
    }
  }

  const extension = config.tsx ? "ts" : "js"

  const tailwindConfigExtension = path.extname(
    config.resolvedPaths.tailwindConfig
  )

  let tailwindConfigTemplate: string
  if (tailwindConfigExtension === ".ts") {
    tailwindConfigTemplate = config.tailwind.cssVariables
      ? templates.TAILWIND_CONFIG_TS_WITH_VARIABLES
      : templates.TAILWIND_CONFIG_TS
  } else {
    tailwindConfigTemplate = config.tailwind.cssVariables
      ? templates.TAILWIND_CONFIG_WITH_VARIABLES
      : templates.TAILWIND_CONFIG
  }

  // Write tailwind config.
  await fs.writeFile(
    config.resolvedPaths.tailwindConfig,
    template(tailwindConfigTemplate)({
      extension,
      prefix: config.tailwind.prefix,
    }),
    "utf8"
  )

  spinner?.succeed()
}

import { existsSync, promises as fs } from "fs"
import path from "path"
import { getConfig } from "@/src/utils/get-config"
import { getPackageManager } from "@/src/utils/get-package-manager"
import { handleError } from "@/src/utils/handle-error"
import { logger } from "@/src/utils/logger"
import { transform } from "@/src/utils/transformers"
import chalk from "chalk"
import { Command, Option } from "commander"
import dotenv from "dotenv"

import "dotenv/config"
import { execa } from "execa"
import ora from "ora"
import prompts from "prompts"
import { z } from "zod"

import { pullOptionsSchema } from "../config/schema"
import { setLogLevel } from "../log"
import { notionPull } from "../pull"

dotenv.config()
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
    "Whether the root page is a database. If not, it must be a 'page'.",
    false
  )
  .option(
    "-m, --markdown-output-path  <string>",
    "Root of the hierarchy for md files. WARNING: docu-notion will delete files from this directory. Note also that if it finds localized images, it will create an i18n/ directory as a sibling.",
    "./docs"
  )
  .option(
    "-t, --status-tag  <string>",
    "Database pages without a Notion page property 'status' matching this will be ignored. Use '*' to ignore status altogether.",
    "Publish"
  )
  .option(
    "-c, --clean-cache",
    "Clear the cache before starting. WARNING: this will remove all files from the cache directory.",
    false
  )
  .addOption(
    new Option("-l, --log-level <level>", "Log level").choices([
      "info",
      "verbose",
      "debug",
    ])
  )
  .option(
    "-p, --img-prefix-in-markdown <string>",
    "When referencing an image from markdown, prefix with this path instead of the full img-output-path. Should be used only in conjunction with --img-output-path."
  )
  .option(
    "-i, --img-output-path  <string>",
    "Path to directory where images will be stored. If this is not included, images will be placed in the same directory as the document that uses them, which then allows for localization of screenshots."
  )
  .option(
    "--require-slugs",
    "If set, docu-notion will fail if any pages it would otherwise publish are missing a slug in Notion.",
    false
  )
  .addOption(
    new Option(
      "--image-file-name-format <format>",
      "format:\n- default: {page slug (if any)}.{image block ID}\n- content-hash: Use a hash of the image content.\n- legacy: Use the legacy (before v0.16) method of determining file names. Set this to maintain backward compatibility.\nAll formats will use the original file extension."
    )
      .choices(["default", "content-hash", "legacy"])
      .default("default")
  )
  .option("-o, --overwrite", "overwrite existing files.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (opts) => {
    try {
      // Validate the cwd option with zod
      const cwdSchema = z.string()
      cwdSchema.parse(opts.cwd)
      // Ensure target directory exists.
      const cwd = path.resolve(opts.cwd)
      if (!existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`)
        process.exit(1)
      }

      const config = await getConfig(cwd)
      if (!config) {
        logger.warn(
          `Configuration is missing. Please run ${chalk.green(
            `init`
          )} to create a components.json file.`
        )
        process.exit(1)
      }
      // Prefer options to config, and config to env vars
      const mergedOptions = {
        ...config,
        ...opts,
        // Get secrets from .env if they exist
        // TODO: Decide if notion token should be in config file or not
        notionToken:
          opts.notionToken || config.notionToken || process.env.NOTION_TOKEN,
        rootPage:
          opts.rootPage || config.rootPage || process.env.NOTION_ROOT_PAGE,
      }

      const options = pullOptionsSchema.parse(mergedOptions)

      setLogLevel(opts.logLevel)

      // pull and convert
      const spinner = ora(`Pulling pages...`).start()

      await notionPull(options).then(() => console.log("docu-notion Finished."))

      /*
      for (const item of payload) {
        spinner.text = `Installing ${item.name}...`
        const targetDir = await getItemTargetPath(
          config,
          item,
          options.path ? path.resolve(cwd, options.path) : undefined
        )

        if (!targetDir) {
          continue
        }

        if (!existsSync(targetDir)) {
          await fs.mkdir(targetDir, { recursive: true })
        }

        const existingComponent = item.files.filter((file) =>
          existsSync(path.resolve(targetDir, file.name))
        )

        if (existingComponent.length && !options.overwrite) {
          if (selectedComponents.includes(item.name)) {
            spinner.stop()
            const { overwrite } = await prompts({
              type: "confirm",
              name: "overwrite",
              message: `Component ${item.name} already exists. Would you like to overwrite?`,
              initial: false,
            })

            if (!overwrite) {
              logger.info(
                `Skipped ${item.name}. To overwrite, run with the ${chalk.green(
                  "--overwrite"
                )} flag.`
              )
              continue
            }

            spinner.start(`Installing ${item.name}...`)
          } else {
            continue
          }
        }

        for (const file of item.files) {
          let filePath = path.resolve(targetDir, file.name)

          // Run transformers.
          const content = await transform({
            filename: file.name,
            raw: file.content,
            config,
            baseColor,
          })

          if (!config.tsx) {
            filePath = filePath.replace(/\.tsx$/, ".jsx")
            filePath = filePath.replace(/\.ts$/, ".js")
          }

          await fs.writeFile(filePath, content)
        }

        const packageManager = await getPackageManager(cwd)

        // Install dependencies.
        if (item.dependencies?.length) {
          await execa(
            packageManager,
            [
              packageManager === "npm" ? "install" : "add",
              ...item.dependencies,
            ],
            {
              cwd,
            }
          )
        }

        // Install devDependencies.
        if (item.devDependencies?.length) {
          await execa(
            packageManager,
            [
              packageManager === "npm" ? "install" : "add",
              "-D",
              ...item.devDependencies,
            ],
            {
              cwd,
            }
          )
        }
      }
      */
      spinner.succeed(`Done.`)
    } catch (error) {
      handleError(error)
    }
  })

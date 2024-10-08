import path from "path"
import { cosmiconfig } from "cosmiconfig"
import { z } from "zod"

import { configFileOptionsSchema } from "../config/schema"

export const DEFAULT_CONFIG_FILENAME = "downloader.json"
export const DEFAULT_STYLE = "default"
export const DEFAULT_COMPONENTS = "@/components"
export const DEFAULT_UTILS = "@/lib/utils"
export const DEFAULT_TAILWIND_CSS = "app/globals.css"
export const DEFAULT_TAILWIND_CONFIG = "tailwind.config.js"
export const DEFAULT_TAILWIND_BASE_COLOR = "slate"

// TODO: Figure out if we want to support all cosmiconfig formats.
const explorer = cosmiconfig("downloader", {
  searchPlaces: [
    "downloader.json",
    "downloader.config.js",
    "downloader.config.cjs",
    "downloader.config.ts",
  ],
})

export const rawConfigSchema = configFileOptionsSchema

// export const rawConfigSchema = z
//   .object({
//     $schema: z.string().optional(),
//     style: z.string(),
//     rsc: z.coerce.boolean().default(false),
//     tsx: z.coerce.boolean().default(true),
//     tailwind: z.object({
//       config: z.string(),
//       css: z.string(),
//       baseColor: z.string(),
//       cssVariables: z.boolean().default(true),
//       prefix: z.string().default("").optional(),
//     }),
//     aliases: z.object({
//       components: z.string(),
//       utils: z.string(),
//       ui: z.string().optional(),
//     }),
//   })
//   .strict()

export type RawConfig = z.infer<typeof rawConfigSchema>

// export const configSchema = rawConfigSchema.extend({
//   resolvedPaths: z.object({
//     tailwindConfig: z.string(),
//     tailwindCss: z.string(),
//     utils: z.string(),
//     components: z.string(),
//     ui: z.string(),
//   }),
// })

export const configSchema = rawConfigSchema

export type Config = z.infer<typeof configSchema>

export async function getConfig(cwd: string) {
  const config = await getRawConfig(cwd)

  if (!config) {
    return null
  }

  return await config //resolveConfigPaths(cwd, config)
}

export async function resolveConfigPaths(cwd: string, config: RawConfig) {
  return configSchema.parse({
    ...config,
    // TODO: Figure out if resolving paths is needed for output paths
    // resolvedPaths: {
    //   tailwindConfig: path.resolve(cwd, config.tailwind.config),
    //   tailwindCss: path.resolve(cwd, config.tailwind.css),
    //   utils: await resolveImport(config.aliases["utils"], tsConfig),
    //   components: await resolveImport(config.aliases["components"], tsConfig),
    //   ui: config.aliases["ui"]
    //     ? await resolveImport(config.aliases["ui"], tsConfig)
    //     : await resolveImport(config.aliases["components"], tsConfig),
    // },
  })
}

export async function getRawConfig(cwd: string): Promise<RawConfig | null> {
  try {
    const configResult = await explorer.search(cwd)

    if (!configResult) {
      return null
    }

    return rawConfigSchema.parse(configResult.config)
  } catch (error) {
    throw new Error(
      `Invalid configuration found in ${cwd} configuration file. Error: ${error}`
    )
  }
}

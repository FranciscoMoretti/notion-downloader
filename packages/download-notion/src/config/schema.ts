import { cacheOptionsSchema } from "notion-downloader"
import { z } from "zod"

export const conversionSchema = z.object({
  skip: z.boolean().default(false),
  statusTag: z.string().default("Publish"),
  overwrite: z.boolean().default(false),
  slugProperty: z.string().optional(),
  pageLinkHasExtension: z.boolean().default(true),
  outputPaths: z.object({
    markdown: z.string().default("./docs"),
    images: z.string().default(""),
  }),
  markdownPrefixes: z.object({
    images: z.string().default(""),
  }),
  layoutStrategy: z
    .enum(["HierarchicalNamedLayoutStrategy", "FlatGuidLayoutStrategy"])
    .default("HierarchicalNamedLayoutStrategy"),
  namingStrategy: z
    .enum(["github-slug", "notion-slug", "guid", "title"])
    .default("github-slug"),
  imageNamingStrategy: z
    .enum(["default", "content-hash", "legacy"])
    .optional()
    .default("default"),
})

export const pullOptionsSchema = z
  .object({
    // Notion Options
    notionToken: z.string(),
    rootId: z.string(),
    rootObjectType: z.enum(["page", "database", "auto"]).default("auto"),
    rootDbAsFolder: z.boolean().default(false),

    // Cache
    cache: cacheOptionsSchema,

    // System
    revalidatePeriod: z.number().default(-1),
    logLevel: z.string().default("info"),
    cwd: z.string(),

    // Conversion Options
    conversion: conversionSchema,
  })
  .strict()

// Same as pullOptionsSchema but all the properties are optional
export const configFileOptionsSchema = pullOptionsSchema
  .partial()
  .omit({ cwd: true })

export type NotionPullOptions = z.infer<typeof pullOptionsSchema>
export type ConversionOptions = z.infer<typeof conversionSchema>

import { cacheOptionsSchema } from "notion-downloader"
import { z } from "zod"

export const conversionSchema = z.object({
  skip: z.boolean().default(false),
  statusTag: z.string().default("Publish"),
  overwrite: z.boolean().default(false),
  slugProperty: z.string().optional(),
  // TODO: filtering should be a list of configurable filters
  statusPropertyName: z.string().default("Status"),
  statusPropertyValue: z.string().default("Done"),
  pageLinkHasExtension: z.boolean().default(true),
  outputPaths: z
    .object({
      markdown: z.string().default("./docs"),
      images: z.string().default(""),
    })
    .default({
      markdown: "./docs",
      images: "",
    }),
  markdownPrefixes: z
    .object({
      images: z.string().default(""),
    })
    .default({
      images: "",
    }),
  layoutStrategy: z
    .enum(["HierarchicalNamedLayoutStrategy", "FlatLayoutStrategy"])
    .default("HierarchicalNamedLayoutStrategy"),
  namingStrategy: z
    .enum(["github-slug", "notion-slug", "guid", "title"])
    .default("github-slug"),
  imageNamingStrategy: z
    // TODO: Make image naming strategies independent of their path building
    .enum(["default", "legacy"])
    .optional()
    .default("default"),
  imageLayoutStrategy: z
    .enum(["HierarchicalNamedLayoutStrategy", "FlatLayoutStrategy"])
    .default("HierarchicalNamedLayoutStrategy"),
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

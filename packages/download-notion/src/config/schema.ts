import { cacheOptionsSchema } from "notion-downloader"
import { z } from "zod"

export const pullOptionsSchema = z
  .object({
    // Notion Options
    notionToken: z.string(),
    rootId: z.string(),
    rootObjectType: z.enum(["page", "database", "auto"]).default("auto"),
    markdownOutputPath: z.string().default("./docs"),
    // Cache
    cache: cacheOptionsSchema,
    // System
    revalidatePeriod: z.number().default(-1),
    logLevel: z.string().default("info"),
    cwd: z.string(),
    // Conversion options
    skipConversion: z.boolean().default(false),
    statusTag: z.string().default("Publish"),
    imgPrefixInMarkdown: z.string().default(""),
    imgOutputPath: z.string().default(""),
    imageFileNameFormat: z
      .enum(["default", "content-hash", "legacy"])
      .optional()
      .default("default"),
    overwrite: z.boolean().default(false),
    titleProperty: z.string().optional(),
    slugProperty: z.string().optional(),
    rootDbAsFolder: z.boolean().default(false),
    layoutStrategy: z
      .enum(["HierarchicalNamedLayoutStrategy", "FlatGuidLayoutStrategy"])
      .default("HierarchicalNamedLayoutStrategy"),
    namingStrategy: z
      .enum(["github-slug", "notion-slug", "guid", "title"])
      .default("github-slug"),
    pageLinkHasExtension: z.boolean().default(true),
  })
  .strict()

// Same as pullOptionsSchema but all the properties are optional
export const configFileOptionsSchema = pullOptionsSchema
  .partial()
  .omit({ cwd: true })

export type NotionPullOptions = z.infer<typeof pullOptionsSchema>

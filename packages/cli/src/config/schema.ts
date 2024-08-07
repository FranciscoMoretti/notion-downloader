import { z } from "zod"

export const pullOptionsSchema = z.object({
  notionToken: z.string(),
  rootPage: z.string(),
  rootIsDb: z.boolean().default(false),
  markdownOutputPath: z.string().default("./docs"),
  cleanCache: z.boolean().default(false),
  statusTag: z.string().default("Publish"),
  logLevel: z.string().default("info"),
  imgPrefixInMarkdown: z.string().default(""),
  imgOutputPath: z.string().default(""),
  requireSlugs: z.boolean().default(false),
  imageFileNameFormat: z
    .enum(["default", "content-hash", "legacy"])
    .optional()
    .default("default"),
  overwrite: z.boolean().default(false),
  cwd: z.string(),
  titleProperty: z.string().optional(),
  slugProperty: z.string().optional(),
  rootDbAsFolder: z.boolean().default(false),
  locales: z.array(z.string()).default([]),
  layoutStrategy: z
    .enum(["HierarchicalNamedLayoutStrategy", "FlatGuidLayoutStrategy"])
    .default("HierarchicalNamedLayoutStrategy"),
})

// Same as pullOptionsSchema but all the properties are optional
export const configFileOptionsSchema = pullOptionsSchema
  .partial()
  .omit({ cwd: true })

import { z } from "zod"

export const pullOptionsSchema = z.object({
  notionToken: z.string(),
  rootPage: z.string(),
  rootIsDb: z.boolean().default(false),
  markdownOutputPath: z.string(),
  cleanCache: z.boolean().default(false),
  statusTag: z.string(),
  logLevel: z.string().default("info"),
  imgPrefixInMarkdown: z.string().default(""),
  imgOutputPath: z.string().default(""),
  overwrite: z.boolean().default(false),
  cwd: z.string(),
  titleProperty: z.string().optional(),
  slugProperty: z.string().optional(),
  rootDbAsFolder: z.boolean().default(false),
})

// Same as pullOptionsSchema but all the properties are optional
export const configFileOptionsSchema = pullOptionsSchema.partial()

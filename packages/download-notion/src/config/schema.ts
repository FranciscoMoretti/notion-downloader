import { ObjectType } from "notion-cache-client"
import { cacheOptionsSchema } from "notion-downloader"
import { z } from "zod"

export enum AssetType {
  Image = "image",
  File = "file",
  Video = "video",
  PDF = "pdf",
  Audio = "audio",
}

export enum TextType {
  Markdown = "markdown",
}

// Merge AssetType into FileType
export type FileType = AssetType | TextType

const assetTypesSchema = z
  .object({
    [AssetType.Image]: z.string().optional(),
    [AssetType.File]: z.string().optional(),
    [AssetType.Video]: z.string().optional(),
    [AssetType.PDF]: z.string().optional(),
    [AssetType.Audio]: z.string().optional(),
  })
  .partial()
  .strict()

export const conversionSchema = z.object({
  skip: z.boolean().default(false),
  statusTag: z.string().default("Publish"),
  overwrite: z.boolean().default(false),
  slugProperty: z.string().optional(),
  // TODO: filtering should be a list of configurable filters
  statusPropertyName: z.string().default("Status"),
  statusPropertyValue: z.string().default("Done"),
  pageLinkHasExtension: z.boolean().default(true),
  outputPaths: assetTypesSchema
    .extend({
      [TextType.Markdown]: z.string().default("./content"),
      assets: z.string().default("./assets"),
    })
    .strict()
    .default({}),
  markdownPrefixes: assetTypesSchema
    .extend({
      [TextType.Markdown]: z.string().default(""),
      assets: z.string().default(""),
    })
    .strict()
    .default({}),
  // TODO: Strategies should be per asset type
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
    rootObjectType: z
      .enum([ObjectType.Page, ObjectType.Database, "auto"])
      .default("auto"),
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

export function mapToAssetType(type: string): AssetType {
  switch (type) {
    case "image":
      return AssetType.Image
    case "file":
      return AssetType.File
    case "video":
      return AssetType.Video
    case "pdf":
      return AssetType.PDF
    case "audio":
      return AssetType.Audio
    default:
      throw new Error(`Invalid asset type: ${type}`)
  }
}

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

export enum LayoutStrategy {
  HierarchicalNamed = "HierarchicalNamedLayoutStrategy",
  Flat = "FlatLayoutStrategy",
}

export const layoutStrategySchema = z.nativeEnum(LayoutStrategy)

export const pathOptionsSchema = z.union([
  z.string(),
  assetTypesSchema
    // TODO: This schema should only be valid if:
    // - The common string is provided
    // - Default is provided and 0 or more other props are provided
    // - markdown-like props are provided and assets-like props are provided
    // - Markdown-like props are (markdown, or (page and database))
    // - Assets-like props are (assets, or (image, file, video, pdf and audio))
    .extend({
      default: z.string().optional(),
      [ObjectType.Page]: z.string().optional(),
      [ObjectType.Database]: z.string().optional(),
      [TextType.Markdown]: z.string().optional(),
      assets: z.string().optional(),
    })
    .strict()
    .default({}),
])

export const pathsSchema = z.object({
  [ObjectType.Page]: z.string(),
  [ObjectType.Database]: z.string(),
  [AssetType.Video]: z.string(),
  [AssetType.PDF]: z.string(),
  [AssetType.Audio]: z.string(),
  [AssetType.Image]: z.string(),
  [AssetType.File]: z.string(),
})

export const conversionSchema = z.object({
  skip: z.boolean().default(false),
  statusTag: z.string().default("Publish"),
  overwrite: z.boolean().default(false),
  slugProperty: z.string().optional(),
  // TODO: filtering should be a list of configurable filters
  statusPropertyName: z.string().default("Status"),
  statusPropertyValue: z.string().default("Done"),
  pageLinkHasExtension: z.boolean().default(true),
  outputPaths: pathOptionsSchema.default("./content"),
  markdownPrefixes: pathOptionsSchema.default(""),
  // TODO: Strategies should be per asset type
  layoutStrategy: layoutStrategySchema.default(
    LayoutStrategy.HierarchicalNamed
  ),
  imageLayoutStrategy: layoutStrategySchema.default(
    LayoutStrategy.HierarchicalNamed
  ),
  namingStrategy: z
    .enum(["github-slug", "notion-slug", "guid", "title"])
    .default("github-slug"),
  imageNamingStrategy: z
    .enum(["default", "legacy"])
    .optional()
    .default("default"),
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

export function parsePathOptions(
  pathOptions: z.infer<typeof pathOptionsSchema>
): z.infer<typeof pathsSchema> {
  if (typeof pathOptions === "string") {
    return {
      [ObjectType.Page]: pathOptions,
      [ObjectType.Database]: pathOptions,
      [AssetType.Video]: pathOptions,
      [AssetType.PDF]: pathOptions,
      [AssetType.Audio]: pathOptions,
      [AssetType.Image]: pathOptions,
      [AssetType.File]: pathOptions,
    }
  }
  return {
    [ObjectType.Page]: firstDefined(
      pathOptions[ObjectType.Page],
      pathOptions[TextType.Markdown],
      pathOptions.default
    ),
    [ObjectType.Database]: firstDefined(
      pathOptions[ObjectType.Database],
      pathOptions[TextType.Markdown],
      pathOptions.default
    ),
    [AssetType.Video]: firstDefined(
      pathOptions[AssetType.Video],
      pathOptions.assets,
      pathOptions.default
    ),
    [AssetType.PDF]: firstDefined(
      pathOptions[AssetType.PDF],
      pathOptions.assets,
      pathOptions.default
    ),
    [AssetType.Audio]: firstDefined(
      pathOptions[AssetType.Audio],
      pathOptions.assets,
      pathOptions.default
    ),
    [AssetType.Image]: firstDefined(
      pathOptions[AssetType.Image],
      pathOptions.assets,
      pathOptions.default
    ),
    [AssetType.File]: firstDefined(
      pathOptions[AssetType.File],
      pathOptions.assets,
      pathOptions.default
    ),
  }
}
function firstDefined(...args: (string | undefined)[]): string {
  const firstDefined = args.find((arg) => arg != undefined)
  if (firstDefined == undefined) {
    throw new Error("No path defined")
  }
  return firstDefined
}

import { ObjectType } from "notion-cache-client"
import { cacheOptionsSchema } from "notion-downloader"
import { m } from "vitest/dist/reporters-yx5ZTtEV"
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

export const allAssetTyes = [
  AssetType.Image,
  AssetType.File,
  AssetType.Video,
  AssetType.PDF,
  AssetType.Audio,
]

const assetPathsSchema = z.object({
  [AssetType.Image]: z.string().optional(),
  [AssetType.File]: z.string().optional(),
  [AssetType.Video]: z.string().optional(),
  [AssetType.PDF]: z.string().optional(),
  [AssetType.Audio]: z.string().optional(),
})

const baseFilepathSchema = z
  .object({
    all: z.string().optional(),
    assets: z.string().optional(),
    [TextType.Markdown]: z.string().optional(),
  })
  .merge(assetPathsSchema)

const filepathSchema = z.union([
  baseFilepathSchema.extend({ all: z.string() }),
  baseFilepathSchema.extend({
    assets: z.string(),
    [TextType.Markdown]: z.string(),
  }),
  baseFilepathSchema
    .extend({
      [TextType.Markdown]: z.string(),
    })
    .merge(assetPathsSchema.required()),
])

export enum LayoutStrategy {
  HierarchicalNamed = "HierarchicalNamedLayoutStrategy",
  Flat = "FlatLayoutStrategy",
}

export const layoutStrategySchema = z.nativeEnum(LayoutStrategy)

export const pathOptionsSchema = z.union([z.string(), filepathSchema])

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
      .enum([String(ObjectType.Page), String(ObjectType.Database), "auto"])
      .default("auto"),
    rootDbAsFolder: z.boolean().default(false),

    // Cache
    cache: cacheOptionsSchema,

    // System
    revalidatePeriod: z.number().default(-1),
    logLevel: z.string().default("info"),
    cwd: z.string().default(process.cwd()),

    // Conversion Options
    conversion: conversionSchema,
  })
  .strict()

// Same as pullOptionsSchema but all the properties are optional
export const configFileOptionsSchema = pullOptionsSchema
  .partial()
  .omit({ cwd: true })

export type NotionPullOptions = z.infer<typeof pullOptionsSchema>
export type NotionPullOptionsInput = Omit<
  z.input<typeof pullOptionsSchema>,
  "notionToken"
>

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
    // Database and page are the same because they are tighlty related
    [ObjectType.Page]: firstDefined(
      pathOptions[TextType.Markdown],
      pathOptions.all
    ),
    [ObjectType.Database]: firstDefined(
      pathOptions[TextType.Markdown],
      pathOptions.all
    ),
    [AssetType.Video]: firstDefined(
      pathOptions[AssetType.Video],
      pathOptions.assets,
      pathOptions.all
    ),
    [AssetType.PDF]: firstDefined(
      pathOptions[AssetType.PDF],
      pathOptions.assets,
      pathOptions.all
    ),
    [AssetType.Audio]: firstDefined(
      pathOptions[AssetType.Audio],
      pathOptions.assets,
      pathOptions.all
    ),
    [AssetType.Image]: firstDefined(
      pathOptions[AssetType.Image],
      pathOptions.assets,
      pathOptions.all
    ),
    [AssetType.File]: firstDefined(
      pathOptions[AssetType.File],
      pathOptions.assets,
      pathOptions.all
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

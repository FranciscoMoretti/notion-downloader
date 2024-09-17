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

export const allAssetTyes = [
  AssetType.Image,
  AssetType.File,
  AssetType.Video,
  AssetType.PDF,
  AssetType.Audio,
]

export enum LayoutStrategyNames {
  HierarchicalNamed = "HierarchicalNamedLayoutStrategy",
  Flat = "FlatLayoutStrategy",
}
export const layoutStrategySchema = z.nativeEnum(LayoutStrategyNames)

export enum AllNamingSchemaName {
  Default = "default",
  Guid = "guid",
}

export enum MarkdownNamingStrategyNames {
  GithubSlug = "github-slug",
  NotionSlug = "notion-slug",
  Title = "title",
}
export enum AssetNamingStrategyNames {
  Legacy = "legacy",
  AncestorPrefix = "ancestor-prefix",
}

export const markdownNamingStrategySchema = z.union([
  z.nativeEnum(MarkdownNamingStrategyNames),
  z.nativeEnum(AllNamingSchemaName),
])
export const assetNamingStrategySchema = z.union([
  z.nativeEnum(AssetNamingStrategyNames),
  z.nativeEnum(AllNamingSchemaName),
])
const allNamingStrategySchema = markdownNamingStrategySchema.and(
  assetNamingStrategySchema
)

export type MarkdownNamingStrategyType =
  | MarkdownNamingStrategyNames
  | AllNamingSchemaName

export type AssetNamingStrategyType =
  | AssetNamingStrategyNames
  | AllNamingSchemaName

export type AllNamingStrategyType = z.infer<typeof allNamingStrategySchema>

function createOptionsSchema<T extends z.ZodType>(valueSchema: T) {
  const assetsBaseSchema = z.object({
    [AssetType.Image]: valueSchema.optional(),
    [AssetType.File]: valueSchema.optional(),
    [AssetType.Video]: valueSchema.optional(),
    [AssetType.PDF]: valueSchema.optional(),
    [AssetType.Audio]: valueSchema.optional(),
  })

  const baseSchema = z
    .object({
      all: valueSchema.optional(),
      assets: valueSchema.optional(),
      [TextType.Markdown]: valueSchema.optional(),
    })
    .merge(assetsBaseSchema)

  return z.union([
    valueSchema,
    baseSchema.extend({ all: valueSchema }),
    baseSchema.extend({
      assets: valueSchema,
      [TextType.Markdown]: valueSchema,
    }),
    baseSchema
      .extend({
        [TextType.Markdown]: valueSchema,
      })
      .merge(assetsBaseSchema.required()),
  ])
}

function createAssetMarkdownOptionsSchema<
  T extends z.ZodType,
  U extends z.ZodType,
  V extends z.ZodType<z.infer<T> & z.infer<U>>
>(assetValueSchema: T, markdownValueSchema: U, allValueSchema: V) {
  const assetsBaseSchema = z.object({
    [AssetType.Image]: assetValueSchema.optional(),
    [AssetType.File]: assetValueSchema.optional(),
    [AssetType.Video]: assetValueSchema.optional(),
    [AssetType.PDF]: assetValueSchema.optional(),
    [AssetType.Audio]: assetValueSchema.optional(),
  })

  const baseSchema = z
    .object({
      all: allValueSchema.optional(),
      assets: assetValueSchema.optional(),
      [TextType.Markdown]: markdownValueSchema.optional(),
    })
    .merge(assetsBaseSchema)

  return z.union([
    allValueSchema,
    baseSchema.extend({ all: allValueSchema }),
    baseSchema.extend({
      assets: assetValueSchema,
      [TextType.Markdown]: markdownValueSchema,
    }),
    baseSchema
      .extend({
        [TextType.Markdown]: markdownValueSchema,
      })
      .merge(assetsBaseSchema.required()),
  ])
}

function createFilesSchema<T extends z.ZodType>(valueSchema: T) {
  return z.object({
    [ObjectType.Page]: valueSchema,
    [ObjectType.Database]: valueSchema,
    [AssetType.Video]: valueSchema,
    [AssetType.PDF]: valueSchema,
    [AssetType.Audio]: valueSchema,
    [AssetType.Image]: valueSchema,
    [AssetType.File]: valueSchema,
  })
}

const pathSchema = z.string()
export const pathsSchema = createFilesSchema(pathSchema)

const filepathSchema = createOptionsSchema(pathSchema)
const layoutStrategyOptionsSchema = createOptionsSchema(layoutStrategySchema)
const namingStrategyOptionsSchema = createAssetMarkdownOptionsSchema(
  assetNamingStrategySchema,
  markdownNamingStrategySchema,
  allNamingStrategySchema
)

export const pathOptionsSchema = z.union([z.string(), filepathSchema])

export const conversionSchema = z.object({
  skip: z.boolean().default(false),
  overwrite: z.boolean().default(false),
  slugProperty: z.string().optional(),
  // TODO: filtering should be a list of configurable filters
  statusPropertyName: z.string().default("Status"),
  statusPropertyValue: z.string().default("Done"),
  pageLinkHasExtension: z.boolean().default(true),
  outputPaths: pathOptionsSchema.default("./content"),
  markdownPrefixes: pathOptionsSchema.default(""),
  layoutStrategy: layoutStrategyOptionsSchema.default(
    LayoutStrategyNames.HierarchicalNamed
  ),
  namingStrategy: namingStrategyOptionsSchema.default(
    AllNamingSchemaName.Default
  ),
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

export type GenericGroup<T> = {
  [ObjectType.Page]: T
  [ObjectType.Database]: T
  [AssetType.Video]: T
  [AssetType.PDF]: T
  [AssetType.Audio]: T
  [AssetType.Image]: T
  [AssetType.File]: T
}

export type GenericAssetMarkdownGroup<T, U> = {
  [ObjectType.Page]: T
  [ObjectType.Database]: T
  [AssetType.Video]: U
  [AssetType.PDF]: U
  [AssetType.Audio]: U
  [AssetType.Image]: U
  [AssetType.File]: U
}

export type FilepathGroup = GenericGroup<z.infer<typeof pathSchema>>
export type LayoutStrategyGroupOptions = GenericGroup<
  z.infer<typeof layoutStrategySchema>
>
export type NamingStrategyGroupOptions = GenericAssetMarkdownGroup<
  z.infer<typeof markdownNamingStrategySchema>,
  z.infer<typeof assetNamingStrategySchema>
>

function parseFileOptions<T extends z.ZodType>(
  options: z.infer<ReturnType<typeof createOptionsSchema<T>>>,
  valueSchema: z.ZodType
): GenericGroup<z.infer<T>> {
  if (valueSchema.safeParse(options).success) {
    return {
      [ObjectType.Page]: options,
      [ObjectType.Database]: options,
      [AssetType.Video]: options,
      [AssetType.PDF]: options,
      [AssetType.Audio]: options,
      [AssetType.Image]: options,
      [AssetType.File]: options,
    } as GenericGroup<z.infer<T>>
  }
  return {
    [ObjectType.Page]: firstDefined(options[TextType.Markdown], options.all),
    [ObjectType.Database]: firstDefined(
      options[TextType.Markdown],
      options.all
    ),
    [AssetType.Video]: firstDefined(
      options[AssetType.Video],
      options.assets,
      options.all
    ),
    [AssetType.PDF]: firstDefined(
      options[AssetType.PDF],
      options.assets,
      options.all
    ),
    [AssetType.Audio]: firstDefined(
      options[AssetType.Audio],
      options.assets,
      options.all
    ),
    [AssetType.Image]: firstDefined(
      options[AssetType.Image],
      options.assets,
      options.all
    ),
    [AssetType.File]: firstDefined(
      options[AssetType.File],
      options.assets,
      options.all
    ),
  } as GenericGroup<z.infer<T>>
}

export function parseNamingStrategyFileOptions(
  options: z.infer<typeof namingStrategyOptionsSchema>
): NamingStrategyGroupOptions {
  if (
    options === AllNamingSchemaName.Default ||
    options === AllNamingSchemaName.Guid
  ) {
    return {
      [ObjectType.Page]: options,
      [ObjectType.Database]: options,
      [AssetType.Video]: options,
      [AssetType.PDF]: options,
      [AssetType.Audio]: options,
      [AssetType.Image]: options,
      [AssetType.File]: options,
    }
  }
  return {
    [ObjectType.Page]: firstDefined(options[TextType.Markdown], options.all),
    [ObjectType.Database]: firstDefined(
      options[TextType.Markdown],
      options.all
    ),
    [AssetType.Video]: firstDefined(
      options[AssetType.Video],
      options.assets,
      options.all
    ),
    [AssetType.PDF]: firstDefined(
      options[AssetType.PDF],
      options.assets,
      options.all
    ),
    [AssetType.Audio]: firstDefined(
      options[AssetType.Audio],
      options.assets,
      options.all
    ),
    [AssetType.Image]: firstDefined(
      options[AssetType.Image],
      options.assets,
      options.all
    ),
    [AssetType.File]: firstDefined(
      options[AssetType.File],
      options.assets,
      options.all
    ),
  }
}

export const parsePathFileOptions = (
  opts: z.infer<ReturnType<typeof createOptionsSchema<typeof pathSchema>>>
) => parseFileOptions<typeof pathSchema>(opts, pathSchema)
export const parseLayoutStrategyFileOptions = (
  opts: z.infer<
    ReturnType<typeof createOptionsSchema<typeof layoutStrategySchema>>
  >
) => parseFileOptions<typeof layoutStrategySchema>(opts, layoutStrategySchema)

function firstDefined<T>(...args: (T | undefined)[]): T {
  const firstDefined = args.find((arg) => arg !== undefined)
  if (firstDefined === undefined) {
    throw new Error("No option defined")
  }
  return firstDefined
}

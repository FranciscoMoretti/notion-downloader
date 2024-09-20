import { ObjectType } from "notion-cache-client"
import { cacheOptionsSchema } from "notion-downloader"
import { z } from "zod"

export const AssetType = z.enum(["image", "file", "video", "pdf", "audio"])
export type AssetType = z.infer<typeof AssetType>

export const TextType = z.enum(["markdown"])
export type TextType = z.infer<typeof TextType>

// Merge AssetType into FileType
export const FileType = z.union([AssetType, TextType])
export type FileType = z.infer<typeof FileType>

export const allAssetTyes = AssetType.options

export const LayoutStrategyNames = z.enum(["hierarchical", "flat"])
export type LayoutStrategyNames = z.infer<typeof LayoutStrategyNames>

export const layoutStrategySchema = LayoutStrategyNames

export const AllNamingSchemaName = z.enum(["default", "guid"])
export type AllNamingSchemaName = z.infer<typeof AllNamingSchemaName>

export const MarkdownNamingStrategyNames = z.enum([
  "githubSlug",
  "notionSlug",
  "title",
])
export type MarkdownNamingStrategyNames = z.infer<
  typeof MarkdownNamingStrategyNames
>

export const AssetNamingStrategyNames = z.enum(["legacy", "ancestorPrefix"])
export type AssetNamingStrategyNames = z.infer<typeof AssetNamingStrategyNames>

// TODO: Convert these to other zod enums with types with same name, or discard if unnecessary
export const markdownNamingStrategySchema = z.union([
  MarkdownNamingStrategyNames,
  AllNamingSchemaName,
])
export const assetNamingStrategySchema = z.union([
  AssetNamingStrategyNames,
  AllNamingSchemaName,
])
const allNamingStrategySchema = markdownNamingStrategySchema.and(
  assetNamingStrategySchema
)

export type MarkdownNamingStrategyType = z.infer<
  typeof markdownNamingStrategySchema
>
export type AssetNamingStrategyType = z.infer<typeof assetNamingStrategySchema>
export type AllNamingStrategyType = z.infer<typeof allNamingStrategySchema>

function createOptionsSchema<T extends z.ZodType>(valueSchema: T) {
  const assetsBaseSchema = z.object({
    [AssetType.enum.image]: valueSchema.optional(),
    [AssetType.enum.file]: valueSchema.optional(),
    [AssetType.enum.video]: valueSchema.optional(),
    [AssetType.enum.pdf]: valueSchema.optional(),
    [AssetType.enum.audio]: valueSchema.optional(),
  })

  const baseSchema = z
    .object({
      all: valueSchema.optional(),
      assets: valueSchema.optional(),
      [TextType.enum.markdown]: valueSchema.optional(),
    })
    .merge(assetsBaseSchema)

  return z.union([
    valueSchema,
    baseSchema.extend({ all: valueSchema }),
    baseSchema.extend({
      assets: valueSchema,
      [TextType.enum.markdown]: valueSchema,
    }),
    baseSchema
      .extend({
        [TextType.enum.markdown]: valueSchema,
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
    [AssetType.enum.image]: assetValueSchema.optional(),
    [AssetType.enum.file]: assetValueSchema.optional(),
    [AssetType.enum.video]: assetValueSchema.optional(),
    [AssetType.enum.pdf]: assetValueSchema.optional(),
    [AssetType.enum.audio]: assetValueSchema.optional(),
  })

  const baseSchema = z
    .object({
      all: allValueSchema.optional(),
      assets: assetValueSchema.optional(),
      [TextType.enum.markdown]: markdownValueSchema.optional(),
    })
    .merge(assetsBaseSchema)

  return z.union([
    allValueSchema,
    baseSchema.extend({ all: allValueSchema }),
    baseSchema.extend({
      assets: assetValueSchema,
      [TextType.enum.markdown]: markdownValueSchema,
    }),
    baseSchema
      .extend({
        [TextType.enum.markdown]: markdownValueSchema,
      })
      .merge(assetsBaseSchema.required()),
  ])
}

function createFilesSchema<T extends z.ZodType>(valueSchema: T) {
  return z.object({
    [ObjectType.enum.page]: valueSchema,
    [ObjectType.enum.database]: valueSchema,
    [AssetType.enum.video]: valueSchema,
    [AssetType.enum.pdf]: valueSchema,
    [AssetType.enum.audio]: valueSchema,
    [AssetType.enum.image]: valueSchema,
    [AssetType.enum.file]: valueSchema,
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
  // TODO: Implement the overwrite feature
  overwrite: z.boolean().default(false),
  slugProperty: z.string().optional(),
  // TODO: filtering should be a list of configurable filters
  statusPropertyName: z.string().default("Status"),
  statusPropertyValue: z.string().default("Done"),
  pageLinkHasExtension: z.boolean().default(true),
  outputPaths: pathOptionsSchema.default("./content"),
  markdownPrefixes: pathOptionsSchema.default(""),
  layoutStrategy: layoutStrategyOptionsSchema.default(
    LayoutStrategyNames.enum.hierarchical
  ),
  namingStrategy: namingStrategyOptionsSchema.default(
    AllNamingSchemaName.enum.default
  ),
})

export const rootObjectTypeSchema = z.enum([
  String(ObjectType.enum.page),
  String(ObjectType.enum.database),
  "auto",
])
const uuidSchema = z.string().length(32)
export const pullOptionsSchema = z
  .object({
    // Notion Options
    notionToken: z.string(),
    rootId: uuidSchema,
    rootObjectType: rootObjectTypeSchema.default("auto"),
    rootDbAsFolder: z.boolean().default(false),

    // Cache
    cache: cacheOptionsSchema
      .extend({
        cacheAssets: z.boolean().default(true),
      })
      .default({}),

    // System
    revalidatePeriod: z.number().default(-1),
    logLevel: z.string().default("info"),
    cwd: z.string().default(process.cwd()),

    // Conversion Options
    conversion: conversionSchema.default({}),
  })
  .strict()

// Same as pullOptionsSchema but all the properties are optional
export const configFileOptionsSchema = pullOptionsSchema
  .partial()
  .omit({ cwd: true })

export const defaultPullOptionsSchema = pullOptionsSchema
  .extend({
    rootId: uuidSchema.default("c974ccd9c70c4abd8a5bd4f5a294e5dd"),
  })
  .omit({ notionToken: true })

export const defaultPullOptions = defaultPullOptionsSchema.parse({})

export type NotionPullOptions = z.infer<typeof pullOptionsSchema>
export type NotionPullOptionsInput = Omit<
  z.input<typeof pullOptionsSchema>,
  "notionToken"
>

export type ConversionOptions = z.infer<typeof conversionSchema>

export function mapToAssetType(type: string): AssetType {
  switch (type) {
    case "image":
      return AssetType.enum.image
    case "file":
      return AssetType.enum.file
    case "video":
      return AssetType.enum.video
    case "pdf":
      return AssetType.enum.pdf
    case "audio":
      return AssetType.enum.audio
    default:
      throw new Error(`Invalid asset type: ${type}`)
  }
}

export type GenericGroup<T> = {
  [ObjectType.enum.page]: T
  [ObjectType.enum.database]: T
  [AssetType.enum.video]: T
  [AssetType.enum.pdf]: T
  [AssetType.enum.audio]: T
  [AssetType.enum.image]: T
  [AssetType.enum.file]: T
}

export type GenericAssetMarkdownGroup<T, U> = {
  [ObjectType.enum.page]: T
  [ObjectType.enum.database]: T
  [AssetType.enum.video]: U
  [AssetType.enum.pdf]: U
  [AssetType.enum.audio]: U
  [AssetType.enum.image]: U
  [AssetType.enum.file]: U
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
      [ObjectType.enum.page]: options,
      [ObjectType.enum.database]: options,
      [AssetType.enum.video]: options,
      [AssetType.enum.pdf]: options,
      [AssetType.enum.audio]: options,
      [AssetType.enum.image]: options,
      [AssetType.enum.file]: options,
    } as GenericGroup<z.infer<T>>
  }
  return {
    [ObjectType.enum.page]: firstDefined(
      options[TextType.enum.markdown],
      options.all
    ),
    [ObjectType.enum.database]: firstDefined(
      options[TextType.enum.markdown],
      options.all
    ),
    [AssetType.enum.video]: firstDefined(
      options[AssetType.enum.video],
      options.assets,
      options.all
    ),
    [AssetType.enum.pdf]: firstDefined(
      options[AssetType.enum.pdf],
      options.assets,
      options.all
    ),
    [AssetType.enum.audio]: firstDefined(
      options[AssetType.enum.audio],
      options.assets,
      options.all
    ),
    [AssetType.enum.image]: firstDefined(
      options[AssetType.enum.image],
      options.assets,
      options.all
    ),
    [AssetType.enum.file]: firstDefined(
      options[AssetType.enum.file],
      options.assets,
      options.all
    ),
  } as GenericGroup<z.infer<T>>
}

export function parseNamingStrategyFileOptions(
  options: z.infer<typeof namingStrategyOptionsSchema>
): NamingStrategyGroupOptions {
  if (
    options === AllNamingSchemaName.enum.default ||
    options === AllNamingSchemaName.enum.guid
  ) {
    return {
      [ObjectType.enum.page]: options,
      [ObjectType.enum.database]: options,
      [AssetType.enum.video]: options,
      [AssetType.enum.pdf]: options,
      [AssetType.enum.audio]: options,
      [AssetType.enum.image]: options,
      [AssetType.enum.file]: options,
    }
  }
  return {
    [ObjectType.enum.page]: firstDefined(
      options[TextType.enum.markdown],
      options.all
    ),
    [ObjectType.enum.database]: firstDefined(
      options[TextType.enum.markdown],
      options.all
    ),
    [AssetType.enum.video]: firstDefined(
      options[AssetType.enum.video],
      options.assets,
      options.all
    ),
    [AssetType.enum.pdf]: firstDefined(
      options[AssetType.enum.pdf],
      options.assets,
      options.all
    ),
    [AssetType.enum.audio]: firstDefined(
      options[AssetType.enum.audio],
      options.assets,
      options.all
    ),
    [AssetType.enum.image]: firstDefined(
      options[AssetType.enum.image],
      options.assets,
      options.all
    ),
    [AssetType.enum.file]: firstDefined(
      options[AssetType.enum.file],
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

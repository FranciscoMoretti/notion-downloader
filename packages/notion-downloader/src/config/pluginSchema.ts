import { z } from "zod"

import { IPlugin } from "../plugins/pluginTypes"

const NotionBlockModification = z.object({
  modify: z.function().args(z.any()).returns(z.void()),
})

const NotionToMarkdownTransform = z.object({
  type: z.string(),
  getStringFromBlock: z
    .function()
    .args(z.any(), z.any())
    .returns(z.union([z.string(), z.promise(z.string())])),
})

const LinkModifier = z.object({
  match: z.instanceof(RegExp),
  convert: z.function().args(z.any(), z.string()).returns(z.string()),
})

const RegexMarkdownModification = z.object({
  regex: z.instanceof(RegExp),
  replacementPattern: z.string().optional(),
  getReplacement: z
    .function()
    .args(z.any(), z.any())
    .returns(z.promise(z.string()))
    .optional(),
  includeCodeBlocks: z.boolean().optional(),
  imports: z.array(z.string()).optional(),
})

export const NotionToMdPlugin = z.object({
  name: z.string(),
  notionBlockModifications: z.array(NotionBlockModification).optional(),
  notionToMarkdownTransforms: z.array(NotionToMarkdownTransform).optional(),
  linkModifier: LinkModifier.optional(),
  regexMarkdownModifications: z.array(RegexMarkdownModification).optional(),
  init: z.function().args(z.any()).returns(z.promise(z.void())).optional(),
})

export type NotionToMdPlugin = z.infer<typeof NotionToMdPlugin>

// Asserting that IPlugin satisfies NotionToMdPlugin
// NOTE: We maintain a zod type for verification and a typescript type for the interface
//       this is because some of the arguments are too complex for a zod type, like `NotionBlock`
export const _: NotionToMdPlugin = {} as IPlugin

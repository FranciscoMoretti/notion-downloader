// TODO: Consider moving this module to its own package
import { z } from "zod"

export const ObjectType = z.enum(["page", "database", "block"])
export type ObjectType = z.infer<typeof ObjectType>

export const PageOrDatabase = z.enum([
  ObjectType.enum.database,
  ObjectType.enum.page,
])
export type PageOrDatabase = z.infer<typeof PageOrDatabase>

export const BlockType = ObjectType.extract([ObjectType.enum.block])
export type BlockType = z.infer<typeof BlockType>

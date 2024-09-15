// TODO: Consider moving this module to its own package
import { z } from "zod"

// TypeScript enum
export enum ObjectType {
  Page = "page",
  Database = "database",
  Block = "block",
}

export type PageOrDatabase = ObjectType.Page | ObjectType.Database

export const ObjectTypeSchema = z.nativeEnum(ObjectType)
export const PageOrDatabaseSchema = z.enum([
  ObjectType.Page,
  ObjectType.Database,
])

import { z } from "zod"

export const cacheStrategiesSchema = z.enum([
  "cache",
  "no-cache",
  "force-cache",
])
export const cacheOptionsSchema = z.object({
  cacheDirectory: z.string().default("./.downloader"),
  cleanCache: z.boolean().default(false),
  cacheStrategy: cacheStrategiesSchema.default("cache"),
})

export type CacheOptions = z.infer<typeof cacheOptionsSchema>
export type CacheOptionsInput = z.input<typeof cacheOptionsSchema>

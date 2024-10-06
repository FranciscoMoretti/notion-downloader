import { z } from "zod"

export const cacheStrategiesSchema = z.enum([
  "cache",
  "no-cache",
  "force-cache",
])

export type CacheStrategy = z.infer<typeof cacheStrategiesSchema>

export const cacheOptionsSchema = z.object({
  cacheDirectory: z.string().default("./.downloader"),
  cleanCache: z.boolean().default(false),
  cacheStrategy: cacheStrategiesSchema.default(
    cacheStrategiesSchema.enum.cache
  ),
})

export type CacheOptions = z.infer<typeof cacheOptionsSchema>
export type CacheOptionsInput = z.input<typeof cacheOptionsSchema>

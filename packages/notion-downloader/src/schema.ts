import { z } from "zod"

export const cacheOptionsSchema = z.object({
  cacheDirectory: z.string().default("./.downloader"),
  cleanCache: z.boolean().default(false),
  cacheStrategy: z.enum(["cache", "no-cache", "force-cache"]).default("cache"),
})

export type CacheOptions = z.infer<typeof cacheOptionsSchema>
export type CacheOptionsInput = z.input<typeof cacheOptionsSchema>

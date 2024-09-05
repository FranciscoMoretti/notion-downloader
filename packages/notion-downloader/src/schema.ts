import { z } from "zod"

export const cacheOptionsSchema = z
  .object({
    cacheDirectory: z.string().default("./.downloader"),
    cleanCache: z.boolean().default(false),
    cacheStrategy: z
      .enum(["cache", "no-cache", "force-cache"])
      .default("cache"),
    cacheImages: z.boolean().default(true),
  })
  .default({})

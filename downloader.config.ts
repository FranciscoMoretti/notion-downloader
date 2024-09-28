import { Config } from "./packages/download-notion/src/index"

const config: Config = {
  conversion: {
    statusPropertyName: "Status",
    statusPropertyValue: "*",
    pageLinkHasExtension: false,
    slugProperty: "slug",
  },
  rootDbAsFolder: true,
  rootObjectType: "page",
  rootId: "dcc4af9c53bf43d881f241b857da66a3",
  cache: {
    cleanCache: false,
    cacheStrategy: "cache",
  },
  logLevel: "info",
  revalidatePeriod: -1,
}

export default config

// TODO Check 3640de39adfb (why is it calling block children multiple times?)

// TODO Check 2a490906-8aa2-40dc-9da5-f1e7e7ebd567 (why is it retrieving block)

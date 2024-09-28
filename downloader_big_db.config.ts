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

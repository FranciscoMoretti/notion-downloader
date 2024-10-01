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
  rootId: "74fe3069cc484ee5b94fb76bd67732ae",
  cache: {
    cleanCache: false,
    cacheStrategy: "cache",
  },
  logLevel: "info",
  revalidatePeriod: -1,
}

export default config

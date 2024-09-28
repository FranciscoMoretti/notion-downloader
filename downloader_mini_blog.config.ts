import { Config } from "./packages/download-notion/src/index"

const config: Config = {
  conversion: {
    statusPropertyName: "Status",
    statusPropertyValue: "*",
    pageLinkHasExtension: false,
    slugProperty: "slug",
  },
  rootDbAsFolder: true,
  rootObjectType: "database",
  rootId: "bbad12b67bcf4390bb503b177f17a9f1",
  cache: {
    cleanCache: false,
    cacheStrategy: "cache",
  },
  logLevel: "debug",
  revalidatePeriod: -1,
}

export default config

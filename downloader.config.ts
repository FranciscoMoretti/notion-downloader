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
  // TODO: FIx not  downloading by block childs
  rootId: "74fe3069cc484ee5b94fb76bd67732ae",
  cache: {
    cleanCache: false,
    cacheStrategy: "cache",
  },
  logLevel: "debug",
  revalidatePeriod: -1,
}

export default config

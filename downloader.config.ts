import { Config } from "./packages/notion-downloader/src/index"

const config: Config = {
  conversion: {
    pageLinkHasExtension: false,
    namingStrategy: {
      markdown: "notionSlug",
      assets: "default",
    },
    outputPaths: {
      markdown: "pages",
      assets: "public",
    },
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

import { Config } from "./packages/download-notion/src/index"

const config: Config = {
  conversion: {
    outputPaths: {
      markdown: "./content/",
      assets: "./public/assets/",
    },
    markdownPrefixes: {
      all: "",
      image: "/assets/",
    },
    layoutStrategy: {
      markdown: "hierarchical",
      assets: "flat",
    },
    statusPropertyName: "Status",
    statusPropertyValue: "Publish",
    pageLinkHasExtension: false,
    slugProperty: "slug",
  },
  rootDbAsFolder: true,
  rootObjectType: "database",
  rootId: "c974ccd9c70c4abd8a5bd4f5a294e5dd",
  cache: {
    cleanCache: false,
    cacheStrategy: "cache",
  },
  logLevel: "debug",
  revalidatePeriod: -1,
}

export default config

/** @type {import('notion-downloader-cli').Config} */
module.exports = {
  conversion: {
    outputPaths: {
      markdown: "./content/",
      assets: "./public/assets/",
    },
    markdownPrefixes: {
      default: "",
      image: "/assets/",
    },
    statusPropertyName: "Status",
    statusPropertyValue: "Publish",
    imageNamingStrategy: "default",
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

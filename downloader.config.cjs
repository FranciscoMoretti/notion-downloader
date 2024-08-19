/** @type {import('notion-downloader-cli').Config} */
module.exports = {
  titleProperty: "title",
  slugProperty: "slug",
  rootDbAsFolder: true,
  rootObjectType: "database",
  rootId: "c974ccd9c70c4abd8a5bd4f5a294e5dd",
  cache: {
    cleanCache: false,
    cacheStrategy: "cache",
  },
  imgOutputPath: "public/assets/",
  imgPrefixInMarkdown: "/assets",
  markdownOutputPath: "./content",
  logLevel: "info",
  pageLinkHasExtension: false,
  revalidatePeriod: -1,
}

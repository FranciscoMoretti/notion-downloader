/** @type {import('notion-downloader-cli').Config} */
module.exports = {
  titleProperty: "title",
  slugProperty: "slug",
  rootDbAsFolder: true,
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

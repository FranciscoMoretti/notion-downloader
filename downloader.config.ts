/* This file is only used when testing docu-notion itself, not when it is used as a library.
  E.g., if you run `npm run pull-test-tagged`, docu-notion will read this file and use it to configure itself,
  using these example plugins.
 */ import {
  Config,
  IPlugin,
  NotionBlock,
} from "./packages/notion-downloader/src/index"

// This is an example of a plugin that needs customization by the end user.
// It uses a closure to supply the plugin with the customization parameter.
function dummyBlockModifier(customParameter: string): IPlugin {
  return {
    name: "dummyBlockModifier",

    notionBlockModifications: [
      {
        modify: (block: NotionBlock) => {
          console.log(
            `dummyBlockModifier has customParameter:${customParameter}.`
          )
        },
      },
    ],
  }
}

const dummyMarkdownModifier: IPlugin = {
  name: "dummyMarkdownModifier",

  regexMarkdownModifications: [
    {
      regex: /aaa(.*)aaa/,
      replacementPattern: "bbb$1bbb",
    },
  ],
}

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
    plugins: [
      // here we're adding a plugin that needs a parameter for customization
      "video",
      // here's we're adding a plugin that doesn't take any customization
      dummyMarkdownModifier,
    ],
  },
  rootDbAsFolder: true,
  rootObjectType: "page",
  rootId: "11a047149aef80ffb78ef8afd3325647",
  cache: {
    cleanCache: false,
    cacheStrategy: "cache",
  },
  logLevel: "info",
  revalidatePeriod: -1,
}

export default config

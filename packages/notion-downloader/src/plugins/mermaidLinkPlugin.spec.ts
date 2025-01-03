import { expect, test } from "vitest"

import { error } from "../log"
import { standardExternalLinkConversion } from "./externalLinks"
import { standardInternalLinkConversion } from "./internalLinks"
import { makeSamplePageObject, oneBlockToMarkdown } from "./pluginTestRun"
import { IPlugin, IPluginContext } from "./pluginTypes"

test("raw url inside a mermaid codeblock gets converted to path using slug of that page", async () => {
  const targetPageId = "123"
  const targetPage = makeSamplePageObject({
    slug: "slug-of-target",
    name: "My Target Page",
    id: targetPageId,
  })

  const input = {
    type: "code",
    code: {
      caption: [],
      rich_text: [
        {
          type: "text",
          text: {
            content: `click A "https://www.notion.so/native/metapages/A-Page-${targetPageId}"`,
            link: null,
          },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: "default",
          },
          plain_text: `click A "https://www.notion.so/native/metapages/A-Page-${targetPageId}"`,
          href: null,
        },
      ],
      language: "mermaid", // notion assumed javascript in my test in which I didn't specify a language
    },
  }

  const mermaidLinks: IPlugin = {
    name: "mermaidLinks",
    regexMarkdownModifications: [
      {
        regex: /```mermaid\n.*"(https:\/\/www\.notion\.so\S+)"/,
        includeCodeBlocks: true,
        getReplacement: async (
          context: IPluginContext,
          match: RegExpExecArray
        ) => {
          const url = match[1]
          const docusaurusUrl =
            context.convertNotionLinkToLocalDocusaurusLink(url)
          if (docusaurusUrl) {
            return match[0].replace(url, docusaurusUrl)
          } else {
            error(`Could not convert link ${url} to a local docusaurus link`)
            return match[0]
          }
        },
      },
    ],
  }

  const results = await oneBlockToMarkdown(
    [
      standardInternalLinkConversion,
      standardExternalLinkConversion,
      mermaidLinks,
    ],
    input,
    targetPage
  )
  expect(results.trim()).toContain(`click A "/slug-of-target"`)
})

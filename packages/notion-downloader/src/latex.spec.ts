import { Client } from "@notionhq/client"
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { NotionToMarkdown } from "notion-to-md"
import { expect, test } from "vitest"

import { defaultPlugins } from "./config/defaultPlugins"
import { defaultPullOptions, parsePathFileOptions } from "./config/schema"
import { FilesManager } from "./files/FilesManager"
import { NotionPage } from "./notionObjects/NotionPage"
import { convertInternalUrl } from "./plugins/internalLinks"
import { IPlugin, IPluginContext } from "./plugins/pluginTypes"
import { getMarkdownFromNotionBlocks } from "./transformMarkdown"

test("Latex Rendering", async () => {
  const pages = new Array<NotionPage>()
  const counts = {
    output_normally: 0,
    skipped_because_empty: 0,
    skipped_because_status: 0,
    skipped_because_level_cannot_have_content: 0,
  }

  const notionClient = new Client({
    auth: "",
  })

  const plugins: IPlugin[] = defaultPlugins

  const context: IPluginContext = {
    getBlockChildren: (id: string) => {
      return new Promise<BlockObjectResponse[]>((resolve) =>
        resolve(new Array<BlockObjectResponse>())
      )
    },
    // this changes with each page
    pageInfo: {
      directoryContainingMarkdown: "",
      slug: "",
    },
    notionToMarkdown: new NotionToMarkdown({ notionClient }),
    options: { ...defaultPullOptions, notionToken: "" },
    filesManager: new FilesManager({
      outputDirectories: parsePathFileOptions(""),
      markdownPrefixes: parsePathFileOptions(""),
    }),
    pages: pages,
    counts: counts, // review will this get copied or pointed to?
    imports: [],
    convertNotionLinkToLocalDocusaurusLink: (url: string) =>
      convertInternalUrl(context, url),
  }

  const blocks: Array<BlockObjectResponse> = [
    {
      object: "block",
      id: "169e1c47-6706-4518-adca-73086b2738ac",
      parent: {
        type: "page_id",
        page_id: "2acc11a4-82a9-4759-b429-fa011c164888",
      },
      created_time: "2023-08-18T15:51:00.000Z",
      last_edited_time: "2023-08-18T15:51:00.000Z",
      created_by: {
        object: "user",
        id: "af5c163e-82b1-49d1-9f1c-539907bb9fb9",
      },
      last_edited_by: {
        object: "user",
        id: "af5c163e-82b1-49d1-9f1c-539907bb9fb9",
      },
      has_children: false,
      archived: false,
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "equation",
            equation: { expression: "x" },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: "default",
            },
            plain_text: "x",
            href: null,
          },
        ],
        color: "default",
      },
      in_trash: false,
    },
  ]

  expect(await getMarkdownFromNotionBlocks(context, plugins, blocks)).toContain(
    "$x$"
  )
})

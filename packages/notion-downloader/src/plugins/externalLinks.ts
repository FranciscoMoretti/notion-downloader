import { error, warning } from "../log"
import { IPlugin, IPluginContext } from "./pluginTypes"

export const standardExternalLinkConversion: IPlugin = {
  name: "standard external link conversion",
  linkModifier: {
    match: /\[.*\]\(http.*\)/,
    convert: (context: IPluginContext, markdownLink: string) => {
      const linkRegExp = /\[([^\]]+)?\]\((http.*)\)/
      const match = linkRegExp.exec(markdownLink)
      if (match === null) {
        error(
          `[standardExternalLinkConversion] Could not parse link ${markdownLink}`
        )
        return markdownLink
      }
      const label = match[1]
      const url = match[2]
      if (label === "bookmark") {
        const replacement = `[${url}](${url})`
        warning(
          `[standardExternalLinkConversion] Found Notion "Bookmark" link. In Notion this would show as an embed. We replace "Bookmark" with the actual URL: ${replacement}`
        )
        return replacement
      }
      return `[${label}](${url})`
    },
  },
}

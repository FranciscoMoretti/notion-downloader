import { standardCalloutTransformer } from "./CalloutTransformer"
import { standardColumnListTransformer } from "./ColumnListTransformer"
import { standardColumnTransformer } from "./ColumnTransformer"
import { standardEscapeHtmlBlockModifier } from "./EscapeHtmlBlockModifier"
import { standardHeadingTransformer } from "./HeadingTransformer"
import { standardTableTransformer } from "./TableTransformer"
import { standardVideoTransformer } from "./VideoTransformer"
import { gifEmbed, imgurGifEmbed } from "./embedTweaks"
import { standardExternalLinkConversion } from "./externalLinks"
import { standardInternalLinkConversion } from "./internalLinks"
import { IPlugin } from "./pluginTypes"

// TODO: Create a section in the documentation that explains all plugins.

const standardPlugins = [
  // Notion "Block" JSON modifiers
  standardEscapeHtmlBlockModifier,
  standardHeadingTransformer, // does operations on both the Notion JSON and then later, on the notion to markdown transform

  // Notion to Markdown transformers. Most things get transformed correctly by the notion-to-markdown library,
  // but some things need special handling.
  standardColumnTransformer, // STandard column transformer uses notion unofficial API
  standardColumnListTransformer,
  standardCalloutTransformer,
  standardTableTransformer,

  standardVideoTransformer,

  // Link modifiers, which are special because they can read metadata from all the pages in order to figure out the correct url
  standardInternalLinkConversion,
  standardExternalLinkConversion,

  // Regexps plus javascript `import`s that operate on the Markdown output
  imgurGifEmbed,
  gifEmbed,
]

export const standardPluginsDict: Record<string, IPlugin> = Object.fromEntries(
  standardPlugins.map((plugin) => [plugin.name, plugin])
)

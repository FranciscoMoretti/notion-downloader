import { standardCalloutTransformer } from "../plugins/CalloutTransformer"
import { standardColumnListTransformer } from "../plugins/ColumnListTransformer"
import { standardColumnTransformer } from "../plugins/ColumnTransformer"
import { standardEscapeHtmlBlockModifier } from "../plugins/EscapeHtmlBlockModifier"
import { standardHeadingTransformer } from "../plugins/HeadingTransformer"
import { standardTableTransformer } from "../plugins/TableTransformer"
import { standardVideoTransformer } from "../plugins/VideoTransformer"
import { gifEmbed, imgurGifEmbed } from "../plugins/embedTweaks"
import { standardExternalLinkConversion } from "../plugins/externalLinks"
import { standardInternalLinkConversion } from "../plugins/internalLinks"
import { IDocuNotionConfig } from "./configuration"

const defaultConfig: IDocuNotionConfig = {
  plugins: [
    // Notion "Block" JSON modifiers
    standardEscapeHtmlBlockModifier,
    // TODO: Investigate if standardHeadingTransformer should be applied. It causes issues by crreating a non-standard block MD_heading_1, MD_heading_2, etc
    // standardHeadingTransformer, // does operations on both the Notion JSON and then later, on the notion to markdown transform

    // Notion to Markdown transformers. Most things get transformed correctly by the notion-to-markdown library,
    // but some things need special handling.
    standardColumnTransformer,
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
  ],
}

export default defaultConfig

import { standardInternalLinkConversion } from "../plugins/internalLinks"
import { IPlugin } from "../plugins/pluginTypes"

// TODO: Create a section in the documentation that explains all plugins.

export const defaultPlugins: IPlugin[] = [standardInternalLinkConversion]

import { exit } from "process"
import * as Cosmic from "cosmiconfig"
import { TypeScriptLoader } from "cosmiconfig-typescript-loader"

import { error, verbose } from "../log"
import { IPlugin } from "../plugins/pluginTypes"
import { standardPluginsDict } from "../plugins/standardPlugins"
import { handleError } from "../utils/handle-error"
import { defaultPlugins } from "./defaultPlugins"
import { NotionToMdPlugin } from "./pluginSchema"
import { PluginsConfig } from "./schema"

function loadOfficialPlugin(pluginName: string): NotionToMdPlugin {
  if (!(pluginName in standardPluginsDict)) {
    throw new Error(`Official plugin "${pluginName}" not found`)
  }
  return NotionToMdPlugin.parse(standardPluginsDict[pluginName])
}

async function initializePlugin(
  plugin: NotionToMdPlugin
): Promise<NotionToMdPlugin> {
  if (plugin.init) {
    verbose(`Initializing plugin ${plugin.name}...`)
    await plugin.init(plugin)
  }
  return plugin
}

export async function loadPlugins(
  configPlugins: PluginsConfig
): Promise<IPlugin[]> {
  let resultingPlugins: IPlugin[] = []

  try {
    const loadedPlugins: IPlugin[] = await Promise.all(
      configPlugins.map(async (plugin) => {
        if (typeof plugin === "string") {
          return await initializePlugin(loadOfficialPlugin(plugin))
        } else {
          return await initializePlugin(plugin)
        }
      })
    )

    resultingPlugins = defaultPlugins.concat(loadedPlugins)
  } catch (e: any) {
    handleError(e.message)
  }

  verbose(`Active plugins: [${resultingPlugins.map((p) => p.name).join(", ")}]`)
  return resultingPlugins
}

import { exit } from "process"

import { error, verbose } from "../log"
import { IPlugin } from "../plugins/pluginTypes"
import { handleError } from "../utils/handle-error"
import defaultConfig from "./default.plugin.config"

export type IPluginsConfig = {
  plugins: IPlugin[]
}

// read the plugins from the config file
// and add them to the map
export async function loadConfigAsync(): Promise<IPluginsConfig> {
  let config: IPluginsConfig = defaultConfig
  try {
    // for now, all we have is plugins
    config = {
      plugins: defaultConfig.plugins,
    }
  } catch (e: any) {
    handleError(e.message)
  }
  verbose(`Active plugins: [${config.plugins.map((p) => p.name).join(", ")}]`)
  return config
}

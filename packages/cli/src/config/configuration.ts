import * as Cosmic from "cosmiconfig";
import defaultConfig from "./default.docunotion.config";
import { error, verbose } from "../log";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";
import { IPlugin } from "../plugins/pluginTypes";
import { exit } from "process";

export type IDocuNotionConfig = {
  plugins: IPlugin[];
};

// read the plugins from the config file
// and add them to the map
export async function loadConfigAsync(): Promise<IDocuNotionConfig> {
  let config: IDocuNotionConfig = defaultConfig;
  try {
    // for now, all we have is plugins
    config = {
      plugins: defaultConfig.plugins,
    };
  } catch (e: any) {
    error(e.message);
    exit(1);
  }
  verbose(`Active plugins: [${config.plugins.map(p => p.name).join(", ")}]`);
  return config;
}

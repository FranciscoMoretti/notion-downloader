import { LayoutStrategyNames } from "../config/schema"
import { NamingStrategy } from "../namingStrategy/NamingStrategy"
import { FlatLayoutStrategy } from "./FlatLayoutStrategy"
import { HierarchicalLayoutStrategy } from "./HierarchicalLayoutStrategy"

export function getLayoutStrategy(
  layoutStrategy: LayoutStrategyNames,
  namingStrategy: NamingStrategy
) {
  return layoutStrategy === LayoutStrategyNames.enum.flat
    ? new FlatLayoutStrategy(namingStrategy)
    : new HierarchicalLayoutStrategy(namingStrategy)
}

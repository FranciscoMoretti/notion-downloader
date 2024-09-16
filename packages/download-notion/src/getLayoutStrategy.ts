import { FlatLayoutStrategy } from "./layoutStrategy/FlatLayoutStrategy"
import { HierarchicalLayoutStrategy } from "./layoutStrategy/HierarchicalLayoutStrategy"
import { NamingStrategy } from "./namingStrategy/NamingStrategy"

export function getLayoutStrategy(
  layoutStrategy: "HierarchicalNamedLayoutStrategy" | "FlatLayoutStrategy",
  namingStrategy: NamingStrategy
) {
  return layoutStrategy === "FlatLayoutStrategy"
    ? new FlatLayoutStrategy(namingStrategy)
    : new HierarchicalLayoutStrategy(namingStrategy)
}

import { NamingStrategy } from "../namingStrategy/NamingStrategy"
import { FlatLayoutStrategy } from "./FlatLayoutStrategy"
import { HierarchicalLayoutStrategy } from "./HierarchicalLayoutStrategy"

export function getLayoutStrategy(
  layoutStrategy: "HierarchicalNamedLayoutStrategy" | "FlatLayoutStrategy",
  namingStrategy: NamingStrategy
) {
  return layoutStrategy === "FlatLayoutStrategy"
    ? new FlatLayoutStrategy(namingStrategy)
    : new HierarchicalLayoutStrategy(namingStrategy)
}

export type NotionObjectTreeNode =
  | {
      id: string
      object: "database" | "page"
      children: Array<NotionObjectTreeNode>
    }
  | {
      id: string
      object: "block"
      type: string
      has_children: boolean
      children: Array<NotionObjectTreeNode>
    }

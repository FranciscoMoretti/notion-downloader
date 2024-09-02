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

export type NotionObjectPlain =
  | {
      id: string
      object: "database" | "page"
      children: Array<string>
    }
  | {
      id: string
      object: "block"
      type: string
      has_children: boolean
      children: Array<string>
    }
export type NotionObjectPlainList = NotionObjectPlain[]
export type NotionObjectPlainMap = Record<string, NotionObjectPlain>

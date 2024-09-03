export type BlockObjectTreeNode = {
  id: string
  object: "block"
  type: string
  has_children: boolean
  children: Array<NotionObjectTreeNode>
  parent: string | null
}

export type NotionObjectTreeNode =
  | {
      id: string
      object: "database" | "page"
      children: Array<NotionObjectTreeNode>
      parent: string | null
    }
  | BlockObjectTreeNode

export type NotionObjectPlain =
  | {
      id: string
      object: "database" | "page"
      children: Array<string>
      parent: string | null
    }
  | {
      id: string
      object: "block"
      type: string
      has_children: boolean
      children: Array<string>
      parent: string | null
    }
export type NotionObjectPlainList = NotionObjectPlain[]
export type NotionObjectPlainMap = Record<string, NotionObjectPlain>

// Add this new interface

export interface NotionObject {
  id: string
  lastEditedTime: string
  object: "database" | "page" | "block"
}

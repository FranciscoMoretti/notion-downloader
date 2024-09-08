import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"

import { NotionObject } from "./NotionObject"

export class NotionBlock implements NotionObject {
  private metadata: BlockObjectResponse

  constructor(objectResponse: BlockObjectResponse) {
    this.metadata = objectResponse
  }

  get id(): string {
    return this.metadata.id
  }

  get object() {
    return this.metadata.object
  }

  get type() {
    return this.metadata.type
  }

  get lastEditedTime(): string {
    return this.metadata.last_edited_time
  }
}

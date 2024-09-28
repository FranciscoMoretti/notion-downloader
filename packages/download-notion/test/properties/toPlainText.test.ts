import {
  RichTextItemResponse,
  TextRichTextItemResponse,
  UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { describe, expect, it } from "vitest"

import {
  stringifyNumber,
  stringifyProperty,
} from "../../src/properties/toPlainText"
import {
  ButtonProperty,
  CheckboxProperty,
  CreatedByProperty,
  CreatedTimeProperty,
  DateProperty,
  EmailProperty,
  FilesProperty,
  FormulaProperty,
  LastEditedByProperty,
  LastEditedTimeProperty,
  MultiSelectProperty,
  NumberProperty,
  PeopleProperty,
  PhoneNumberProperty,
  RelationProperty,
  RichTextProperty,
  RollupProperty,
  SelectProperty,
  StatusProperty,
  TitleProperty,
  UniqueIdProperty,
  UrlProperty,
  VerificationProperty,
} from "../../src/properties/types"

const sampleUser: UserObjectResponse = {
  name: "User1",
  id: "user_1",
  avatar_url: "avatar_url",
  type: "person",
  person: { email: "user1@example.com" },
  object: "user",
}

const sampleTextRichTextItem: TextRichTextItemResponse = {
  type: "text",
  plain_text: "Rich Text",
  text: { content: "Rich Text", link: null },
  href: null,
  annotations: {
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    color: "default",
  },
}

describe("stringifyProperty", () => {
  it("should stringify number property", () => {
    const property: NumberProperty = {
      type: "number",
      id: "id_1",
      number: 42,
    }
    expect(stringifyProperty(property)).toBe("42")
  })

  it("should stringify url property", () => {
    const property: UrlProperty = {
      type: "url",
      id: "id_1",
      url: "https://example.com",
    }
    expect(stringifyProperty(property)).toBe("https://example.com")
  })

  it("should stringify select property", () => {
    const property: SelectProperty = {
      type: "select",
      id: "id_1",
      select: { name: "Option1", id: "id_1", color: "blue" },
    }
    expect(stringifyProperty(property)).toBe("Option1")
  })

  it("should stringify multi_select property", () => {
    const property: MultiSelectProperty = {
      type: "multi_select",
      id: "id_1",
      multi_select: [
        { name: "Option1", id: "id_1", color: "blue" },
        { name: "Option2", id: "id_2", color: "red" },
      ],
    }
    expect(stringifyProperty(property)).toBe("Option1, Option2")
  })

  it("should stringify status property", () => {
    const property: StatusProperty = {
      type: "status",
      id: "id_1",
      status: { name: "In Progress", id: "id_1", color: "blue" },
    }
    expect(stringifyProperty(property)).toBe("In Progress")
  })

  it("should stringify date property", () => {
    const property: DateProperty = {
      type: "date",
      id: "id_1",
      date: { start: "2023-01-01", end: "2023-01-02", time_zone: "UTC" },
    }
    expect(stringifyProperty(property)).toBe("2023-01-01 → 2023-01-02")
  })

  it("should stringify date property with only start date", () => {
    const property: DateProperty = {
      type: "date",
      id: "id_1",
      date: { start: "2023-01-01", end: null, time_zone: "UTC" },
    }
    expect(stringifyProperty(property)).toBe("2023-01-01")
  })

  it("should stringify email property", () => {
    const property: EmailProperty = {
      type: "email",
      id: "id_1",
      email: "test@example.com",
    }
    expect(stringifyProperty(property)).toBe("test@example.com")
  })

  it("should stringify phone_number property", () => {
    const property: PhoneNumberProperty = {
      type: "phone_number",
      id: "id_1",
      phone_number: "123-456-7890",
    }
    expect(stringifyProperty(property)).toBe("123-456-7890")
  })

  it("should stringify checkbox property", () => {
    const property: CheckboxProperty = {
      type: "checkbox",
      id: "id_1",
      checkbox: true,
    }
    expect(stringifyProperty(property)).toBe("true")
  })

  it("should stringify files property", () => {
    const property: FilesProperty = {
      type: "files",
      id: "id_1",
      files: [
        {
          file: {
            expiry_time: "2023-01-01T00:00:00Z",

            url: "file1.png",
          },
          name: "file1.png",
        },
        { external: { url: "file2.jpg" }, name: "file2.jpg" },
      ],
    }
    expect(stringifyProperty(property)).toBe("file1.png, file2.jpg")
  })

  it("should stringify created_by property", () => {
    const property: CreatedByProperty = {
      type: "created_by",
      id: "id_1",
      created_by: sampleUser,
    }
    expect(stringifyProperty(property)).toBe("User1")
  })

  it("should stringify created_time property", () => {
    const property: CreatedTimeProperty = {
      type: "created_time",
      id: "id_1",
      created_time: "2023-01-01T00:00:00Z",
    }
    expect(stringifyProperty(property)).toBe("2023-01-01T00:00:00Z")
  })

  it("should stringify last_edited_by property", () => {
    const property: LastEditedByProperty = {
      type: "last_edited_by",
      id: "id_1",
      last_edited_by: sampleUser,
    }
    expect(stringifyProperty(property)).toBe("User1")
  })

  it("should stringify last_edited_time property", () => {
    const property: LastEditedTimeProperty = {
      type: "last_edited_time",
      id: "id_1",
      last_edited_time: "2023-01-02T00:00:00Z",
    }
    expect(stringifyProperty(property)).toBe("2023-01-02T00:00:00Z")
  })

  it("should stringify formula property with string", () => {
    const property: FormulaProperty = {
      type: "formula",
      id: "id_1",
      formula: { type: "string", string: "Result" },
    }
    expect(stringifyProperty(property)).toBe("Result")
  })

  it("should stringify formula property with number", () => {
    const property: FormulaProperty = {
      type: "formula",
      id: "id_1",
      formula: { type: "number", number: 100 },
    }
    expect(stringifyProperty(property)).toBe("100")
  })

  it("should stringify formula property with boolean", () => {
    const property: FormulaProperty = {
      type: "formula",
      id: "id_1",
      formula: { type: "boolean", boolean: true },
    }
    expect(stringifyProperty(property)).toBe("true")
  })

  it("should stringify formula property with date", () => {
    const property: FormulaProperty = {
      type: "formula",
      id: "id_1",
      formula: {
        type: "date",
        date: { start: "2023-01-01", end: null, time_zone: null },
      },
    }
    expect(stringifyProperty(property)).toBe("2023-01-01")
  })

  it("should stringify button property", () => {
    const property: ButtonProperty = {
      type: "button",
      id: "id_1",
      button: {},
    }
    expect(stringifyProperty(property)).toBe("button")
  })

  it("should stringify unique_id property", () => {
    const property: UniqueIdProperty = {
      type: "unique_id",
      id: "id_1",
      unique_id: { prefix: "ID-", number: 123 },
    }
    expect(stringifyProperty(property)).toBe("ID-123")
  })

  it("should stringify verification property", () => {
    const property: VerificationProperty = {
      type: "verification",
      id: "id_1",
      verification: {
        state: "verified",
        date: { start: "2023-01-01", end: null, time_zone: null },
        verified_by: sampleUser,
      },
    }
    expect(stringifyProperty(property)).toBe("verified")
  })

  it("should stringify title property", () => {
    const property: TitleProperty = {
      type: "title",
      id: "id_1",
      title: [sampleTextRichTextItem],
    }
    expect(stringifyProperty(property)).toBe("Rich Text")
  })

  it("should stringify rich_text property", () => {
    const property: RichTextProperty = {
      type: "rich_text",
      id: "id_1",
      rich_text: [sampleTextRichTextItem],
    }
    expect(stringifyProperty(property)).toBe("Rich Text")
  })

  it("should stringify people property", () => {
    const property: PeopleProperty = {
      type: "people",
      id: "id_1",
      people: [sampleUser, sampleUser],
    }
    expect(stringifyProperty(property)).toBe("User1, User1")
  })

  it("should stringify relation property", () => {
    const property: RelationProperty = {
      type: "relation",
      id: "id_1",
      relation: [{ id: "rel_1" }, { id: "rel_2" }],
    }
    expect(stringifyProperty(property)).toBe("rel_1, rel_2")
  })

  it("should stringify rollup property with number", () => {
    const property: RollupProperty = {
      type: "rollup",
      id: "id_1",
      rollup: { type: "number", function: "sum", number: 200 },
    }
    expect(stringifyProperty(property)).toBe("sum 200")
  })

  // Add more rollup tests as needed
})

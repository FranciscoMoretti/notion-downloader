import {
  PageObjectResponse,
  PartialUserObjectResponse,
  RichTextItemResponse,
  UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

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
} from "./types"

type PageProperty = PageObjectResponse["properties"][string]
type PropertyWithoutId<T> = Omit<T, "id"> & { id?: string }

export function stringifyProperty(property: PageProperty) {
  switch (property.type) {
    case "number":
      return stringifyNumber(property)
    case "url":
      return stringifyUrl(property)
    case "select":
      return stringifySelect(property)
    case "multi_select":
      return stringifyMultiSelect(property)
    case "status":
      return stringifyStatus(property)
    case "date":
      return stringifyDate(property)
    case "email":
      return stringifyEmail(property)
    case "phone_number":
      return stringifyPhoneNumber(property)
    case "checkbox":
      return stringifyCheckbox(property)
    case "files":
      return stringifyFiles(property)
    case "created_by":
      return stringifyCreatedBy(property)
    case "created_time":
      return stringifyCreatedTime(property)
    case "last_edited_by":
      return stringifyLastEditedBy(property)
    case "last_edited_time":
      return stringifyLastEditedTime(property)
    case "formula":
      return stringifyFormula(property)
    case "button":
      return stringifyButton(property)
    case "unique_id":
      return stringifyUniqueId(property)
    case "verification":
      return stringifyVerification(property)
    case "title":
      return stringifyTitle(property)
    case "rich_text":
      return stringifyRichText(property)
    case "people":
      return stringifyPeople(property)
    case "relation":
      return stringifyRelation(property)
    case "rollup":
      return stringifyRollup(property)
    default:
      throw new Error(
        `Unknown property type in ${JSON.stringify(
          property,
          null,
          2
        )}. Handling for this property type was not implemented. Please open an issue.`
      )
  }
}

export function stringifyNumber(
  property: PropertyWithoutId<NumberProperty>
): string {
  return property.number?.toString() || ""
}

export function stringifyUrl(property: PropertyWithoutId<UrlProperty>): string {
  return property.url || ""
}

export function stringifySelect(
  property: PropertyWithoutId<SelectProperty>
): string {
  return property.select?.name || ""
}

export function stringifyMultiSelect(
  property: PropertyWithoutId<MultiSelectProperty>
): string {
  return property.multi_select.map((item) => item.name).join(", ")
}
export function stringifyStatus(
  property: PropertyWithoutId<StatusProperty>
): string {
  return property.status?.name || ""
}

export function stringifyDate(
  property: PropertyWithoutId<DateProperty>
): string {
  const date = property.date
  return stringifyDateResponse(date)
}

export function stringifyEmail(
  property: PropertyWithoutId<EmailProperty>
): string {
  return property.email || ""
}

export function stringifyPhoneNumber(
  property: PropertyWithoutId<PhoneNumberProperty>
): string {
  return property.phone_number || ""
}

export function stringifyCheckbox(
  property: PropertyWithoutId<CheckboxProperty>
): string {
  return property.checkbox ? "true" : "false"
}

export function stringifyFiles(
  property: PropertyWithoutId<FilesProperty>
): string {
  // TODO: Should these contain URLS or names?
  return property.files.map((file) => file.name).join(", ")
}

export function stringifyCreatedBy(
  property: PropertyWithoutId<CreatedByProperty>
): string {
  return stringifyUserResponse(property.created_by)
}

export function stringifyCreatedTime(
  property: PropertyWithoutId<CreatedTimeProperty>
): string {
  return property.created_time
}

export function stringifyLastEditedBy(
  property: PropertyWithoutId<LastEditedByProperty>
): string {
  return stringifyUserResponse(property.last_edited_by)
}

export function stringifyLastEditedTime(
  property: PropertyWithoutId<LastEditedTimeProperty>
): string {
  return property.last_edited_time
}

export function stringifyFormula(
  property: PropertyWithoutId<FormulaProperty>
): string {
  if (property.formula.type === "string") {
    return property.formula.string || ""
  } else if (property.formula.type === "number") {
    return property.formula.number?.toString() || ""
  } else if (property.formula.type === "boolean") {
    return property.formula.boolean ? "true" : "false"
  } else if (property.formula.type === "date") {
    return stringifyDateResponse(property.formula.date)
  }
  return "unknown formula type"
}

export function stringifyButton(
  property: PropertyWithoutId<ButtonProperty>
): string {
  return "button"
}

export function stringifyUniqueId(
  property: PropertyWithoutId<UniqueIdProperty>
): string {
  // {
  //     type: "unique_id";
  //     unique_id: {
  //         prefix: string | null;
  //         number: number | null;
  //     };
  //     id: string;
  // }
  return (
    property.unique_id.prefix + (property.unique_id.number?.toString() || "")
  )
}

export function stringifyVerification(
  property: PropertyWithoutId<VerificationProperty>
): string {
  const verification = property.verification
  // TODO: Decide if verification should include the verfied_by information
  if (!verification) {
    return ""
  }
  return verification.state
}

export function stringifyTitle(
  property: PropertyWithoutId<TitleProperty>
): string {
  return strigifyRichTextResponseArray(property.title)
}

export function stringifyRichText(
  property: PropertyWithoutId<RichTextProperty>
): string {
  return strigifyRichTextResponseArray(property.rich_text)
}

export function stringifyPeople(
  property: PropertyWithoutId<PeopleProperty>
): string {
  return property.people
    .map((person) => stringifyUserResponse(person))
    .join(", ")
}

export function stringifyRelation(
  property: PropertyWithoutId<RelationProperty>
): string {
  return property.relation.map((relation) => relation.id).join(", ")
}

export function stringifyRollup(
  property: PropertyWithoutId<RollupProperty>
): string {
  // {
  //     "id": "%5E%7Cy%3C",
  //     "type": "rollup",
  //     "rollup": {
  //       "rollup_property_name": "Days to complete",
  //       "relation_property_name": "Tasks",
  //       "rollup_property_id": "\\nyY",
  //       "relation_property_id": "Y]<y",
  //       "function": "sum"
  //     }
  //   }
  const rollup = property.rollup
  const functionName = rollup.function
  if (rollup.type === "number") {
    return functionName + " " + rollup.number?.toString() || ""
  } else if (rollup.type === "date") {
    return functionName + " " + stringifyDateResponse(rollup.date)
  }
  return (
    functionName +
    " " +
    rollup.array
      // TODO: Fix ID required in this stringifyProperty function, but not actually needed.
      .map((item) => stringifyProperty({ ...item, id: "" }))
      .join(", ")
  )
}

export function stringifyRichTextItemResponse(richText: RichTextItemResponse) {
  return richText.plain_text
}

export function strigifyRichTextResponseArray(
  richTextArray: RichTextItemResponse[]
) {
  return richTextArray
    .map((part) => stringifyRichTextItemResponse(part))
    .join("")
}

export function stringifyUserResponse(
  user: PartialUserObjectResponse | UserObjectResponse
) {
  // TODO: Decide what to keep of potential person objects
  if (!("name" in user)) {
    return user.id
  }
  return user.name || ""
}

export function stringifyDateResponse(
  date:
    | DateProperty["date"]
    | Extract<FormulaProperty["formula"], { type: "date" }>["date"]
) {
  if (date?.start && date?.end) {
    return date.start + " → " + date.end
  }
  if (date?.start && !date?.end) {
    return date.start
  }
  if (!date?.start && date?.end) {
    return date.end
  }
  return ""
}

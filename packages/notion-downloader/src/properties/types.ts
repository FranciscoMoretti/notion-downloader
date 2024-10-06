import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { z } from "zod"

export const PropertyType = z.enum([
  "number",
  "url",
  "select",
  "multi_select",
  "status",
  "date",
  "email",
  "phone_number",
  "checkbox",
  "files",
  "created_by",
  "created_time",
  "last_edited_by",
  "last_edited_time",
  "formula",
  "button",
  "unique_id",
  "verification",
  "title",
  "rich_text",
  "people",
  "relation",
  "rollup",
])

// Extracted property types
export type NumberProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "number" }
>
export type NumberPropertyValue = NumberProperty["number"]

export type UrlProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "url" }
>
export type UrlPropertyValue = UrlProperty["url"]

export type SelectProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "select" }
>
export type SelectPropertyValue = SelectProperty["select"]

export type MultiSelectProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "multi_select" }
>

export type StatusProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "status" }
>

export type StatusPropertyValue = StatusProperty["status"]

export type MultiSelectPropertyValue = MultiSelectProperty["multi_select"]

export type DateProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "date" }
>
export type DatePropertyValue = DateProperty["date"]

export type EmailProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "email" }
>
export type EmailPropertyValue = EmailProperty["email"]

export type PhoneNumberProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "phone_number" }
>
export type PhoneNumberPropertyValue = PhoneNumberProperty["phone_number"]

export type CheckboxProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "checkbox" }
>
export type CheckboxPropertyValue = CheckboxProperty["checkbox"]

export type FilesProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "files" }
>
export type FilesPropertyValue = FilesProperty["files"]

export type CreatedByProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "created_by" }
>
export type CreatedByPropertyValue = CreatedByProperty["created_by"]

export type CreatedTimeProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "created_time" }
>
export type CreatedTimePropertyValue = CreatedTimeProperty["created_time"]

export type LastEditedByProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "last_edited_by" }
>
export type LastEditedByPropertyValue = LastEditedByProperty["last_edited_by"]

export type LastEditedTimeProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "last_edited_time" }
>
export type LastEditedTimePropertyValue =
  LastEditedTimeProperty["last_edited_time"]

export type FormulaProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "formula" }
>
export type FormulaPropertyValue = FormulaProperty["formula"]

export type ButtonProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "button" }
>
export type ButtonPropertyValue = ButtonProperty["button"]

export type UniqueIdProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "unique_id" }
>
export type UniqueIdPropertyValue = UniqueIdProperty["unique_id"]

export type VerificationProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "verification" }
>
export type VerificationPropertyValue = VerificationProperty["verification"]

export type TitleProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "title" }
>
export type TitlePropertyValue = TitleProperty["title"]

export type RichTextProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "rich_text" }
>
export type RichTextPropertyValue = RichTextProperty["rich_text"]

export type PeopleProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "people" }
>
export type PeoplePropertyValue = PeopleProperty["people"]

export type RelationProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "relation" }
>
export type RelationPropertyValue = RelationProperty["relation"]

export type RollupProperty = Extract<
  PageObjectResponse["properties"][string],
  { type: "rollup" }
>
export type RollupPropertyValue = RollupProperty["rollup"]

export type PageProperty = PageObjectResponse["properties"][string]

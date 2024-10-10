import { describe, expect, it } from "vitest"

import { getLinkMatchingRegex } from "./transformMarkdown"

describe("getLinkMatchingRegex", () => {
  it("matches multiple markdown links including Notion UUIDs", () => {
    const regex = getLinkMatchingRegex()
    const text =
      "Check out [Google](https://google.com), [OpenAI](https://openai.com), and [My Notion Page](https://www.notion.so/myworkspace/My-Page-123e4567-e89b-12d3-a456-426614174000)."
    const matches: RegExpExecArray[] = []
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push(match)
    }
    expect(matches.length).toBe(3)
    expect(matches[0][0]).toBe("[Google](https://google.com)")
    expect(matches[1][0]).toBe("[OpenAI](https://openai.com)")
    expect(matches[2][0]).toBe(
      "[My Notion Page](https://www.notion.so/myworkspace/My-Page-123e4567-e89b-12d3-a456-426614174000)"
    )
  })

  it("does not match markdown images", () => {
    const regex = getLinkMatchingRegex()
    const text =
      "![Alt text](https://image.com/image.png) and [Valid Link](https://valid.com)."
    const matches: RegExpExecArray[] = []
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push(match)
    }
    expect(matches.length).toBe(1)
    expect(matches[0][0]).toBe("[Valid Link](https://valid.com)")
  })

  it("ignores image links and matches only valid links", () => {
    const regex = getLinkMatchingRegex()
    const text =
      "Here is an image ![Image](https://image.com) and a link [Link](https://link.com)."
    const matches: RegExpExecArray[] = []
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push(match)
    }
    expect(matches.length).toBe(1)
    expect(matches[0][0]).toBe("[Link](https://link.com)")
  })

  it("does not match exclamation marks not followed by image syntax", () => {
    const regex = getLinkMatchingRegex()
    const text = "!This is not an image [Link](https://link.com)"
    const matches: RegExpExecArray[] = []
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push(match)
    }
    expect(matches.length).toBe(1)
    expect(matches[0][0]).toBe("[Link](https://link.com)")
  })

  it("handles strings without any links", () => {
    const regex = getLinkMatchingRegex()
    const text = "This string has no links or images."
    const matches: RegExpExecArray[] = []
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push(match)
    }
    expect(matches.length).toBe(0)
  })

  it("matches Notion links with different UUID formats", () => {
    const regex = getLinkMatchingRegex()
    const text =
      "Here are some Notion links: [Page 1](https://www.notion.so/Page-1-abcdef123456), [Page 2](https://www.notion.so/myworkspace/Page-2-98765432-dcba-4321-abcd-123456789012)."
    const matches: RegExpExecArray[] = []
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push(match)
    }
    expect(matches.length).toBe(2)
    expect(matches[0][0]).toBe(
      "[Page 1](https://www.notion.so/Page-1-abcdef123456)"
    )
    expect(matches[1][0]).toBe(
      "[Page 2](https://www.notion.so/myworkspace/Page-2-98765432-dcba-4321-abcd-123456789012)"
    )
  })
})

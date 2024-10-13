import { describe, expect, test } from "vitest"

import { convertMarkdownPath } from "../src/files/markdownPathUtils"

describe("markdownPathUtils", () => {
  describe("convertMarkdownPath", () => {
    test("converts backslashes to forward slashes", () => {
      expect(convertMarkdownPath("path\\to\\file.md")).toBe("path/to/file.md")
    })

    test("keeps forward slashes unchanged", () => {
      expect(convertMarkdownPath("path/to/file.md")).toBe("path/to/file.md")
    })

    test("handles mixed slashes", () => {
      expect(convertMarkdownPath("path\\to/file\\subdir/doc.md")).toBe(
        "path/to/file/subdir/doc.md"
      )
    })

    test("URI-encodes special characters", () => {
      expect(convertMarkdownPath("path/to/file with spaces.md")).toBe(
        "path/to/file%20with%20spaces.md"
      )
      expect(convertMarkdownPath("path/to/file_with_underscore.md")).toBe(
        "path/to/file_with_underscore.md"
      )
      expect(convertMarkdownPath("path/to/file-with-dashes.md")).toBe(
        "path/to/file-with-dashes.md"
      )
      expect(convertMarkdownPath("path/to/file+with+plus.md")).toBe(
        "path/to/file+with+plus.md"
      )
    })

    test("handles paths with non-ASCII characters", () => {
      expect(convertMarkdownPath("path/to/文件.md")).toBe(
        "path/to/%E6%96%87%E4%BB%B6.md"
      )
      expect(convertMarkdownPath("path/to/ファイル.md")).toBe(
        "path/to/%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB.md"
      )
    })

    test("handles absolute paths", () => {
      expect(convertMarkdownPath("/absolute/path/to/file.md")).toBe(
        "/absolute/path/to/file.md"
      )
      expect(convertMarkdownPath("C:\\Windows\\Path\\file.md")).toBe(
        "C:/Windows/Path/file.md"
      )
    })

    test("handles empty path", () => {
      expect(convertMarkdownPath("")).toBe("")
    })

    test("creates valid markdown internal link", () => {
      const convertedPath = convertMarkdownPath("path/to/file with spaces.md")
      const markdownLink = `[Link Text](${convertedPath})`
      expect(markdownLink).toBe("[Link Text](path/to/file%20with%20spaces.md)")
    })
    test("Links to a section in the same file", () => {
      const convertedPath = convertMarkdownPath("path/to/file with spaces.md")
      const markdownLink = `[Link Text](${convertedPath}#section-id)`
      expect(markdownLink).toBe(
        "[Link Text](path/to/file%20with%20spaces.md#section-id)"
      )
    })
  })
})

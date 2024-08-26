import { hashOfBufferContent, hashOfString } from "@/src/utils"
import { beforeEach, describe, expect, it } from "vitest"

import { ContentHashImageNamingStrategy } from "../src/ContentHashImageNamingStrategy"
import { DefaultImageNamingStrategy } from "../src/DefaultImageNamingStrategy"
import { LegacyImageNamingStrategy } from "../src/LegacyImageNamingStrategy"
import { NotionImage } from "../src/NotionImage"

describe("Image Naming Strategies", () => {
  const mockNotionImage = {
    getImageSet: () => ({ primaryUrl: "https://example.com/image.png" }),
    id: "mock-block-id",
    extension: "png",
    buffer: Buffer.from("mock image data"),
  } as NotionImage

  describe("DefaultImageNamingStrategy", () => {
    const getPageAncestorFilename = (image: NotionImage) => "mock-page"
    const strategy = new DefaultImageNamingStrategy(getPageAncestorFilename)

    it("should generate filename with ancestor page name", () => {
      const result = strategy.getFileName(mockNotionImage)
      expect(result).toBe("mock-page.mock-block-id.png")
    })

    it("should generate filename without ancestor page name", () => {
      const strategyWithoutAncestor = new DefaultImageNamingStrategy(() => "")
      const result = strategyWithoutAncestor.getFileName(mockNotionImage)
      expect(result).toBe("mock-block-id.png")
    })
  })

  describe("ContentHashImageNamingStrategy", () => {
    const strategy = new ContentHashImageNamingStrategy()

    it("should generate filename based on content hash", () => {
      const result = strategy.getFileName(mockNotionImage)
      expect(result).toBe("15208f4337a8e92d4785.png")
      expect(result).toBe(`${hashOfBufferContent(mockNotionImage.buffer)}.png`)
    })
  })

  describe("LegacyImageNamingStrategy", () => {
    const strategy = new LegacyImageNamingStrategy()

    it("should generate filename based on UUID from URL", () => {
      const UUID = "d1bcdc8c-b065-4e40-9a11-392aabeb220e"
      const mockImageWithUUID = {
        ...mockNotionImage,
        getImageSet: () => ({
          primaryUrl: `https://prod-files-secure.s3.us-west-2.amazonaws.com/d9a2b712-cf69-4bd6-9d65-87a4ceeacca2/${UUID}/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230915%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230915T161258Z&X-Amz-Expires=3600&X-Amz-Signature=28fca48e65fba86d539c3c4b7676fce1fa0857aa194f7b33dd4a468ecca6ab24&X-Amz-SignedHeaders=host&x-id=GetObject`,
        }),
      }
      const result = strategy.getFileName(mockImageWithUUID as NotionImage)
      expect(result).toBe("1786534424.png")
      expect(result).toBe(`${hashOfString(UUID)}.png`)
    })

    it("should use full URL if no UUID found", () => {
      const result = strategy.getFileName(mockNotionImage)
      expect(result).toBe("1057079531.png")
      expect(result).toBe(
        `${hashOfString(mockNotionImage.getImageSet().primaryUrl)}.png`
      )
    })
  })
})
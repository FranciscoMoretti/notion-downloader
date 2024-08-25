import { describe, expect, test } from "vitest"

import { makeImagePersistencePlan } from "./MakeImagePersistencePlan"
import { NotionPullOptions } from "./config/schema"
import { ImageSet } from "./images"
import { hashOfString } from "./utils"

const optionsUsingDefaultNaming: NotionPullOptions = {
  notionToken: "",
  rootId: "",
  markdownOutputPath: "",
  imgOutputPath: "",
  imgPrefixInMarkdown: "",
  statusTag: "",
  rootObjectType: "page",
  cache: {
    cacheDirectory: "",
    cleanCache: false,
    cacheStrategy: "cache",
  },
  logLevel: "info",
  cwd: "",
  skipConversion: false,
  revalidatePeriod: 0,
  slugProperty: "",
  overwrite: false,
  rootDbAsFolder: false,
  layoutStrategy: "HierarchicalNamedLayoutStrategy",
  imageFileNameFormat: "default",
  namingStrategy: "guid",
  pageLinkHasExtension: false,
}

const testImageSet: ImageSet = {
  primaryUrl: "https://s3.us-west-2.amazonaws.com/primaryImage?Blah=foo",
  pageInfo: {
    directoryContainingMarkdown: "/pathToParentSomewhere/",
    : "",
    slug: "my-page",
  },
  fileData: {
    ext: "png",
    mime: "image/png",
    buffer: Buffer.from("some fake image content"),
  },
}

test("primary file with explicit file output path and prefix", () => {
  const outputPaths = makeImagePersistencePlan(
    optionsUsingDefaultNaming,
    testImageSet,
    "ABC-123",
    "./static/notion_imgs",
    "/notion_imgs"
  )
  const expectedFileName = "my-page.ABC-123.png"
  expect(outputPaths?.outputFileName).toBe(`${expectedFileName}`)
  expect(outputPaths?.primaryFileOutputPath).toBe(
    `static/notion_imgs/${expectedFileName}`
  )
  expect(outputPaths?.filePathToUseInMarkdown).toBe(
    `/notion_imgs/${expectedFileName}`
  )
})
test("primary file with defaults for image output path and prefix", () => {
  const outputPaths = makeImagePersistencePlan(
    optionsUsingDefaultNaming,
    testImageSet,
    "ABC-123",
    "",
    ""
  )
  const expectedFileName = "my-page.ABC-123.png"
  expect(outputPaths?.outputFileName).toBe(`${expectedFileName}`)

  // the default behavior is to put the image next to the markdown file
  expect(outputPaths?.primaryFileOutputPath).toBe(
    `/pathToParentSomewhere/${expectedFileName}`
  )
  expect(outputPaths?.filePathToUseInMarkdown).toBe(`./${expectedFileName}`)
})
test("falls back to getting file extension from url if not in fileType", () => {
  const outputPaths = makeImagePersistencePlan(
    optionsUsingDefaultNaming,
    testImageSet,
    "ABC-123",
    "",
    ""
  )
  expect(outputPaths?.outputFileName).toBe("my-page.ABC-123.png")
})

// I'm not sure it is even possible to have encoded characters in the slug, but this proves
// we are properly encoding them in the markdown file but not in the file system.
// (This test originally was for including original file names, but we decided not to do that.)
test("handles encoded characters", () => {
  const imageSet: ImageSet = {
    ...testImageSet,
    pageInfo: {
      directoryContainingMarkdown: "/pathToParentSomewhere/",
      slug: "my-page%281%29",
    },
  }
  const outputPaths = makeImagePersistencePlan(
    optionsUsingDefaultNaming,
    imageSet,
    "ABC-123",
    "",
    ""
  )
  expect(outputPaths.primaryFileOutputPath).toBe(
    `/pathToParentSomewhere/my-page(1).ABC-123.png`
  )
  expect(outputPaths.filePathToUseInMarkdown).toBe(
    `./my-page%281%29.ABC-123.png`
  )
})

const optionsUsingHashNaming: NotionPullOptions = {
  ...optionsUsingDefaultNaming,
  imageFileNameFormat: "content-hash",
}
test("hash naming", () => {
  const outputPaths = makeImagePersistencePlan(
    optionsUsingHashNaming,
    testImageSet,
    "ABC-123",
    "",
    ""
  )
  const expectedFileName = "fe3f26fd515b3cf299ac.png"
  expect(outputPaths?.outputFileName).toBe(`${expectedFileName}`)
})

const optionsUsingLegacyNaming: NotionPullOptions = {
  ...optionsUsingDefaultNaming,
  imageFileNameFormat: "legacy",
}
test("Legacy naming", () => {
  const outputPaths = makeImagePersistencePlan(
    optionsUsingLegacyNaming,
    testImageSet,
    "ABC-123",
    "./static/notion_imgs",
    "/notion_imgs"
  )
  const expectedHash = hashOfString(
    "https://s3.us-west-2.amazonaws.com/primaryImage"
  )
  expect(outputPaths.outputFileName).toBe(`${expectedHash}.png`)
})
test("Legacy naming - properly extract UUID from old-style notion image url", () => {
  const imageSet: ImageSet = {
    ...testImageSet,
    primaryUrl:
      "https://s3.us-west-2.amazonaws.com/secure.notion-static.com/e1058f46-4d2f-4292-8388-4ad393383439/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20220516%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20220516T233630Z&X-Amz-Expires=3600&X-Amz-Signature=f215704094fcc884d37073b0b108cf6d1c9da9b7d57a898da38bc30c30b4c4b5&X-Amz-SignedHeaders=host&x-id=GetObject",
  }
  const outputPaths = makeImagePersistencePlan(
    optionsUsingLegacyNaming,
    imageSet,
    "ABC-123",
    "./static/notion_imgs",
    "/notion_imgs"
  )
  const expectedHash = hashOfString("e1058f46-4d2f-4292-8388-4ad393383439")
  expect(outputPaths?.outputFileName).toBe(`${expectedHash}.png`)
})
test("Legacy naming - properly extract UUID from new-style (Sept 2023) notion image url", () => {
  const imageSet: ImageSet = {
    ...testImageSet,
    primaryUrl:
      "https://prod-files-secure.s3.us-west-2.amazonaws.com/d9a2b712-cf69-4bd6-9d65-87a4ceeacca2/d1bcdc8c-b065-4e40-9a11-392aabeb220e/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230915%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230915T161258Z&X-Amz-Expires=3600&X-Amz-Signature=28fca48e65fba86d539c3c4b7676fce1fa0857aa194f7b33dd4a468ecca6ab24&X-Amz-SignedHeaders=host&x-id=GetObject",
  }
  const outputPaths = makeImagePersistencePlan(
    optionsUsingLegacyNaming,
    imageSet,
    "ABC-123",
    "./static/notion_imgs",
    "/notion_imgs"
  )
  const expectedHash = hashOfString("d1bcdc8c-b065-4e40-9a11-392aabeb220e")
  expect(outputPaths?.outputFileName).toBe(`${expectedHash}.png`)
})

// In order to make image fallback work with other languages, we have to have
// a file for each image, in each Docusaurus language directory. This is true
// whether we have a localized version of the image or not.
// The imageSet is initially populated with placeholders for each language.
// This test ensures that these placeholders are replaced with actual urls
// when localized versions of the image are listed.
// TODO write this test

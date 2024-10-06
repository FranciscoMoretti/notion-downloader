import path from "path"
import { getConfig } from "@/src/utils/get-config"
import { expect, test } from "vitest"

test("init config-full", async () => {
  const targetDir = path.resolve(__dirname, "../fixtures/config-full")

  await getConfig(targetDir)
})

test("init config-partial", async () => {
  // For now partial configs are accepted because the CLI can provide missing values
  const targetDir = path.resolve(__dirname, "../fixtures/config-partial")

  await getConfig(targetDir)
})

test("init config-invalid", async () => {
  const targetDir = path.resolve(__dirname, "../fixtures/config-invalid")

  await expect(getConfig(targetDir)).rejects.toThrow()
})

test("init config-none", async () => {
  const targetDir = path.resolve(__dirname, "../fixtures/config-invalid")

  await expect(getConfig(targetDir)).rejects.toThrow()
})

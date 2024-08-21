import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { databaseResponse } from "./NotionCache.test"

export async function createTempDir() {
  const ostmpdir = os.tmpdir()
  const tmpdir = path.join(ostmpdir, "unit-test-")
  return await fs.mkdtemp(tmpdir)
}
export function addSecondsToIsoString(seconds = 60) {
  return new Date(
    new Date(databaseResponse.last_edited_time).getTime() + seconds * 1000
  ).toISOString()
}

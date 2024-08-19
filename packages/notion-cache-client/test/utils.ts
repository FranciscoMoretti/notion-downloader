import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

export async function createTempDir() {
  const ostmpdir = os.tmpdir()
  const tmpdir = path.join(ostmpdir, "unit-test-")
  return await fs.mkdtemp(tmpdir)
}

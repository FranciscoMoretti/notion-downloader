import { promises as fs } from "fs"
import { tmpdir } from "os"
import path from "path"
import { Config } from "@/src/utils/get-config"
import { transformImport } from "@/src/utils/transformers/transform-import"
import { transformJsx } from "@/src/utils/transformers/transform-jsx"
import { transformRsc } from "@/src/utils/transformers/transform-rsc"
import { Project, ScriptKind, type SourceFile } from "ts-morph"
import { z } from "zod"

export type TransformOpts = {
  filename: string
  raw: string
  config: Config
}

export type Transformer<Output = SourceFile> = (
  opts: TransformOpts & {
    sourceFile: SourceFile
  }
) => Promise<Output>

const transformers: Transformer[] = [transformImport, transformRsc]

const project = new Project({
  compilerOptions: {},
})

async function createTempSourceFile(filename: string) {
  const dir = await fs.mkdtemp(path.join(tmpdir(), "shadcn-"))
  return path.join(dir, filename)
}

export async function transform(opts: TransformOpts) {
  const tempFile = await createTempSourceFile(opts.filename)
  const sourceFile = project.createSourceFile(tempFile, opts.raw, {
    scriptKind: ScriptKind.TSX,
  })

  for (const transformer of transformers) {
    transformer({ sourceFile, ...opts })
  }

  return await transformJsx({
    sourceFile,
    ...opts,
  })
}

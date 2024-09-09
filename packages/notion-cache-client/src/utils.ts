import fs from "fs-extra"

export async function saveObjectToJson(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  await fs.writeFile(filename, json)
}

export async function loadDataFromJson(filePath: string) {
  if (fs.existsSync(filePath)) {
    return fs.readFile(filePath, "utf8").then((data) => JSON.parse(data))
  }
  return Promise.resolve(undefined)
}

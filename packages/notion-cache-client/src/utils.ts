import fs from "fs-extra"

export async function saveDataToJson(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  await fs.writeFile(filename, json)
}

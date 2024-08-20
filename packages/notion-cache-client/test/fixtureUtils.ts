import path from "node:path"

export function getFixture(name: "sample-site") {
  return path.resolve(__dirname, `fixtures/${name}/.downloader`)
}

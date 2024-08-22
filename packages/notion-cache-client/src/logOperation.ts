import { info } from "./log"

export function logOperation({
  level,
  source,
  operation,
  resource_type,
  id,
}: {
  level: number
  source: string
  operation: string
  resource_type: string
  id: string
}) {
  const levelPadding = "  ".repeat(Math.max(level - 1, 0)) + (level ? "└─" : "")
  info(`${levelPadding}[${source}]: (${operation}) (${resource_type}) : ${id}`)
}

import { logger } from "@/src/utils_old/logger"

export function handleError(error: unknown): never {
  if (typeof error === "string") {
    logger.error(error)
    process.exit(1)
  }

  if (error instanceof Error) {
    logger.error(error.message)
    process.exit(1)
  }

  logger.error("Something went wrong. Please try again.")
  process.exit(1)
}

import { error, warning } from "./log"
import { rateLimit } from "./notionLimiter"

// While everything works fine locally, on Github Actions we are getting a lot of timeouts, so
// we're trying this extra retry-able wrapper.

export async function executeWithRateLimitAndRetries<T>(
  label: string,
  asyncFunction: () => Promise<T>
): Promise<T> {
  await rateLimit()
  const kRetries = 10
  let lastException = undefined
  for (let i = 0; i < kRetries; i++) {
    try {
      return await asyncFunction()
    } catch (e: any) {
      lastException = e
      if (
        e?.code === "notionhq_client_request_timeout" ||
        e.message.includes("timeout") ||
        e.message.includes("Timeout") ||
        e.message.includes("limit") ||
        e.message.includes("Limit") ||
        e?.code === "notionhq_client_response_error" ||
        e?.code === "service_unavailable"
      ) {
        const secondsToWait = i + 1
        warning(
          `While doing "${label}", got error "${
            e.message as string
          }". Will retry after ${secondsToWait}s...`
        )
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * secondsToWait)
        )
      } else {
        throw e
      }
    }
  }

  error(`Error: could not complete "${label}" after ${kRetries} retries.`)
  throw lastException
}

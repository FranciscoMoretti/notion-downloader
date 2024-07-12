import { RateLimiter } from "limiter-es6-compat"

import { logDebug } from "./log"

const notionLimiter = new RateLimiter({
  tokensPerInterval: 3,
  interval: "second",
})

export async function rateLimit() {
  if (notionLimiter.getTokensRemaining() < 1) {
    logDebug("rateLimit", "*** delaying for rate limit")
  }
  await notionLimiter.removeTokens(1)
}

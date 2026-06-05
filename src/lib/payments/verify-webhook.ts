/**
 * Verify a Lemon Squeezy webhook signature.
 *
 * LS signs each webhook payload with HMAC-SHA256 using the store's signing
 * secret. The signature comes in the `X-Signature` header.
 *
 * Reject any request whose signature doesn't match — that's a forged webhook.
 *
 * Docs: https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyLemonSqueezySignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const hmac = createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  // timingSafeEqual requires both buffers to have the same length.
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

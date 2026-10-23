import crypto from 'crypto';

export function verifySePayWebhookSignature(
  rawBody: string,
  providedSignature: string | null,
  secret: string
): boolean {
  if (!providedSignature || !secret) {
    return false;
  }
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(rawBody).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(providedSignature)
  );
}

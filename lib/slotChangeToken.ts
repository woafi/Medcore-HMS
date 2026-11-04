import crypto from "crypto";

type SlotChangeTokenPayload = {
  appointmentId: string;
  slotId: string | null;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.SLOT_CHANGE_TOKEN_SECRET;
  if (!secret) {
    throw new Error("SLOT_CHANGE_TOKEN_SECRET must be configured for appointment rescheduling.");
  }
  return secret;
}

export function createSlotChangeToken(
  appointmentId: string,
  slotId: string | null,
  expiresAt: Date
): string {
  const payload = Buffer.from(
    JSON.stringify({ appointmentId, slotId, exp: Math.floor(expiresAt.getTime() / 1000) })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function verifySlotChangeToken(
  token: string
): Pick<SlotChangeTokenPayload, "appointmentId" | "slotId"> | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !("appointmentId" in decoded) ||
      !("slotId" in decoded) ||
      !("exp" in decoded) ||
      typeof decoded.appointmentId !== "string" ||
      (typeof decoded.slotId !== "string" && decoded.slotId !== null) ||
      typeof decoded.exp !== "number" ||
      decoded.exp * 1000 <= Date.now()
    ) {
      return null;
    }
    return { appointmentId: decoded.appointmentId, slotId: decoded.slotId };
  } catch {
    return null;
  }
}

export function getBangladeshDayEnd(date: Date): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 17, 59, 59, 999));
}

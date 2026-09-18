import { db } from "@/db";
import { appErrors, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

type LogAppErrorInput = {
  source: string;
  message: string;
  slug?: string | null;
  businessId?: string | null;
  detail?: string | null;
};

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Best-effort insert — never throws to callers. */
export async function logAppError(input: LogAppErrorInput): Promise<void> {
  try {
    const message = truncate(input.message.trim() || "Unknown error", 1000);
    const detail = input.detail ? truncate(input.detail.trim(), 2000) : null;
    let businessId = input.businessId ?? null;
    const slug = input.slug?.trim() || null;

    if (!businessId && slug) {
      const [row] = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.slug, slug))
        .limit(1);
      businessId = row?.id ?? null;
    }

    await db.insert(appErrors).values({
      businessId,
      slug,
      source: truncate(input.source, 120),
      message,
      detail,
    });
  } catch (err) {
    console.error("logAppError failed", err);
  }
}

export function errorDetail(err: unknown): string {
  if (err instanceof Error) {
    return truncate(`${err.name}: ${err.message}`, 2000);
  }
  return truncate(String(err), 2000);
}

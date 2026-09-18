import { NextRequest, NextResponse } from "next/server";
import { logAppError } from "@/lib/errorLog";

export const dynamic = "force-dynamic";

/**
 * Public endpoint so the customer review page can report load/draft failures.
 * Best-effort only — always returns 204 so it never blocks the customer UI.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      source?: string;
      message?: string;
      slug?: string;
      detail?: string;
    };

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return new NextResponse(null, { status: 204 });
    }

    await logAppError({
      source:
        typeof body.source === "string" && body.source.trim()
          ? body.source.trim()
          : "review_client",
      message,
      slug: typeof body.slug === "string" ? body.slug : null,
      detail: typeof body.detail === "string" ? body.detail : null,
    });
  } catch (err) {
    console.error("POST /api/review/errors failed", err);
  }

  return new NextResponse(null, { status: 204 });
}

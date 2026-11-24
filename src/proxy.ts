import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const digest = (text: string) => createHash("sha256").update(text).digest();

/** True if the Basic auth header carries the site password. Any user name works. */
export function passwordMatches(header: string | null, password: string): boolean {
  const encoded = header?.match(/^Basic ([A-Za-z0-9+/=]+)$/i)?.[1];
  if (!encoded) return false;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const colon = decoded.indexOf(":");
  // Hashed first, so the comparison takes the same time for any guess.
  return colon >= 0 && timingSafeEqual(digest(decoded.slice(colon + 1)), digest(password));
}

/** One shared password for a hosted copy. Off when SITE_PASSWORD is not set locally. */
export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD?.trim();
  if (!password) {
    // A hosted copy must never be open by accident.
    return process.env.RENDER ? new NextResponse("SITE_PASSWORD is not set.", { status: 503 }) : NextResponse.next();
  }
  if (!passwordMatches(request.headers.get("authorization"), password)) {
    return new NextResponse("Password needed.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="GTM Engine", charset="UTF-8"', "Cache-Control": "no-store" },
    });
  }
  // Browsers resend the password automatically, so other sites must not be able to use it.
  if (!["GET", "HEAD"].includes(request.method) && request.headers.get("sec-fetch-site") === "cross-site") {
    return new NextResponse("Not allowed.", { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  // Open: the host's health check, and static files that hold no data.
  matcher: ["/((?!api/health$|_next/static/|favicon.ico$).*)"],
};

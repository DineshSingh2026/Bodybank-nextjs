import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Serves the legacy marketing shell at `/` while keeping the URL as `/`.
 * Static file lives at `public/index.html` (copied from the original app).
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/index.html";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};

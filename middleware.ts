import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { setSecurityHeaders } from "@/lib/security/headers"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // セキュリティヘッダーを設定
  setSecurityHeaders(response)
  
  return response
}

export const config = {
  matcher: [
    /*
     * 以下のパスにマッチ:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}


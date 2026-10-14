import { NextRequest, NextResponse } from "next/server"

const USER_TOKEN_KEY = "access_token"
const AUTH_PAGES = ["/login", "/register"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const userToken =
    request.cookies.get(USER_TOKEN_KEY)?.value ||
    request.cookies.get("snapgram_access_token")?.value

  const isAuthPage = AUTH_PAGES.includes(pathname)

  // Chưa login mà vào trang khác -> đẩy ra /login
  if (!userToken && !isAuthPage) {
    const url = new URL("/login", request.url)
    if (pathname !== "/") url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Đã login mà vào /login hoặc /register -> về trang chủ
  if (userToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
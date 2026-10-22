import { NextRequest, NextResponse } from "next/server"

const USER_TOKEN_KEY = "access_token"
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"]

// Các trang cho phép người dùng truy cập trực tiếp từ link bên ngoài mà không bắt buộc đăng nhập trước
// (chỉ khi nhấn tương tác như tim, bình luận, lưu, theo dõi... mới hiện popup login)
function isPublicContentPath(pathname: string): boolean {
  return (
    pathname === "/verify-email" ||
    pathname === "/payment/result" ||
    pathname === "/explore" ||
    pathname === "/reels" ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/reel/") ||
    pathname.startsWith("/u/")
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const userToken =
    request.cookies.get(USER_TOKEN_KEY)?.value ||
    request.cookies.get("snapgram_access_token")?.value

  const isAuthPage = AUTH_PAGES.includes(pathname)

  // Đã login mà vào /login, /register, /forgot-password, /reset-password -> về trang chủ
  if (userToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Cho phép mở trực tiếp link bài viết (/p/:id), reel (/reel/:id), explore, verify-email...
  if (isPublicContentPath(pathname)) {
    return NextResponse.next()
  }

  // Chưa login mà vào trang gốc (/) hoặc trang cá nhân (/profile, /settings...) -> đẩy ra /login
  if (!userToken && !isAuthPage) {
    const url = new URL("/login", request.url)
    const redirectTo = `${pathname}${request.nextUrl.search}`
    if (redirectTo !== "/") url.searchParams.set("redirect", redirectTo)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
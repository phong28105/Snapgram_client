"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import axios from "axios"

function FacebookCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginFacebook } = useAuth()
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description") || searchParams.get("error_reason")
    const state = searchParams.get("state")

    // 1. Popup mode: Gửi thông điệp về cửa sổ cha (window.opener)
    if (window.opener && window.opener !== window) {
      if (error) {
        window.opener.postMessage(
          {
            type: "FACEBOOK_OAUTH_ERROR",
            error: errorDescription || error || "Đã hủy đăng nhập Facebook.",
          },
          window.location.origin
        )
      } else if (code) {
        window.opener.postMessage(
          {
            type: "FACEBOOK_OAUTH_SUCCESS",
            code,
            state,
          },
          window.location.origin
        )
      }
      window.close()
      return
    }

    // 2. Redirect mode (Fallback khi popup bị chặn)
    if (error) {
      const msg = error === "access_denied" ? "Bạn đã hủy cấp quyền đăng nhập bằng Facebook." : (errorDescription || "Đăng nhập Facebook thất bại.")
      setErrorText(msg)
      toast.error(msg)
      setTimeout(() => router.replace("/login"), 2500)
      return
    }

    if (!code) {
      setErrorText("Không tìm thấy mã xác thực từ Facebook.")
      setTimeout(() => router.replace("/login"), 2500)
      return
    }

    const processLogin = async () => {
      try {
        const redirectUri = `${window.location.origin}/oauth/callback/facebook`
        const res = await loginFacebook({ code, redirectUri })

        if (res.requiresTwoFa && res.tempToken) {
          // Lưu token tạm và chuyển sang trang login để nhập 2FA
          sessionStorage.setItem("snapgram_2fa_temp_token", res.tempToken)
          toast.info("Tài khoản yêu cầu xác thực 2 bước (2FA).")
          router.replace("/login?twoFa=true")
          return
        }

        toast.success("Đăng nhập bằng Facebook thành công!")
        const targetRedirect = sessionStorage.getItem("snapgram_oauth_redirect") || "/"
        sessionStorage.removeItem("snapgram_oauth_redirect")
        window.location.href = targetRedirect.startsWith("/") ? targetRedirect : "/"
      } catch (err: unknown) {
        const errMsg =
          (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) ||
          "Đăng nhập Facebook thất bại. Vui lòng thử lại sau."
        setErrorText(errMsg)
        toast.error(errMsg)
        setTimeout(() => router.replace("/login"), 2500)
      }
    }

    void processLogin()
  }, [searchParams, router, loginFacebook])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-border bg-card shadow-lg flex flex-col items-center text-center">
        {errorText ? (
          <>
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 text-xl font-bold">
              ✕
            </div>
            <h2 className="text-lg font-semibold mb-2">Đăng nhập thất bại</h2>
            <p className="text-sm text-muted-foreground mb-4">{errorText}</p>
            <p className="text-xs text-muted-foreground">Đang quay lại trang đăng nhập...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <h2 className="text-lg font-semibold mb-2">Đang xác thực Facebook</h2>
            <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function FacebookCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <FacebookCallbackContent />
    </Suspense>
  )
}

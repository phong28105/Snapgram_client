"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import axios from "axios"

interface FacebookLoginButtonProps {
  onSuccess?: () => void
  onRequiresTwoFa?: (tempToken: string) => void
  disabled?: boolean
  className?: string
  text?: string
}

export default function FacebookLoginButton({
  onSuccess,
  onRequiresTwoFa,
  disabled = false,
  className = "",
  text = "Tiếp tục với Facebook",
}: FacebookLoginButtonProps) {
  const { loginFacebook } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleFacebookLogin = () => {
    if (disabled || isLoading) return

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    if (!appId) {
      toast.error("Facebook App ID chưa được cấu hình.")
      return
    }

    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem("snapgram_facebook_oauth_state", state)

    const params = new URLSearchParams(window.location.search)
    const redirectParam = params.get("redirect")
    if (redirectParam) {
      sessionStorage.setItem("snapgram_oauth_redirect", redirectParam)
    }

    const redirectUri = `${window.location.origin}/oauth/callback/facebook`
    const dialogUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=email,public_profile&response_type=code&state=${state}`

    const width = 600
    const height = 650
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    setIsLoading(true)

    const popup = window.open(
      dialogUrl,
      "facebook_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    )

    // Fallback: nếu popup bị chặn bởi trình duyệt
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      window.location.href = dialogUrl
      return
    }

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data?.type === "FACEBOOK_OAUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage)
        clearInterval(timer)

        const { code, state: returnedState } = event.data
        const storedState = sessionStorage.getItem("snapgram_facebook_oauth_state")
        sessionStorage.removeItem("snapgram_facebook_oauth_state")

        if (storedState && returnedState && storedState !== returnedState) {
          toast.error("Xác thực bảo mật state không khớp. Vui lòng thử lại.")
          setIsLoading(false)
          return
        }

        try {
          const res = await loginFacebook({ code, redirectUri })
          if (res.requiresTwoFa && res.tempToken) {
            if (onRequiresTwoFa) {
              onRequiresTwoFa(res.tempToken)
            } else {
              toast.info("Tài khoản yêu cầu xác thực 2 bước (2FA).")
            }
            return
          }

          toast.success("Đăng nhập bằng Facebook thành công!")
          if (onSuccess) {
            onSuccess()
          } else {
            const redirect = params.get("redirect") || "/"
            window.location.href = redirect.startsWith("/") ? redirect : "/"
          }
        } catch (err: unknown) {
          const errorMsg =
            (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) ||
            "Đăng nhập Facebook thất bại. Vui lòng thử lại sau."
          toast.error(errorMsg)
        } finally {
          setIsLoading(false)
        }
      } else if (event.data?.type === "FACEBOOK_OAUTH_ERROR") {
        window.removeEventListener("message", handleMessage)
        clearInterval(timer)
        setIsLoading(false)
        toast.error(event.data.error || "Đăng nhập Facebook thất bại.")
      }
    }

    window.addEventListener("message", handleMessage)

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer)
        window.removeEventListener("message", handleMessage)
        setIsLoading(false)
      }
    }, 800)
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || isLoading}
      onClick={handleFacebookLogin}
      className={`w-full h-12 rounded-xl border-border hover:bg-muted/60 transition-colors flex items-center justify-center gap-3 font-medium text-sm text-foreground ${className}`}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )}
      <span>{isLoading ? "Đang kết nối Facebook..." : text}</span>
    </Button>
  )
}

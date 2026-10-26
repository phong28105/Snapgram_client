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
      toast.error("Facebook App ID chưa được cấu hình trong biến môi trường.")
      return
    }

    const rawState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem("snapgram_facebook_oauth_state", rawState)

    const params = new URLSearchParams(window.location.search)
    const redirectParam = params.get("redirect")
    if (redirectParam) {
      sessionStorage.setItem("snapgram_oauth_redirect", redirectParam)
    }

    const redirectUri = `${window.location.origin}/oauth/callback/facebook`
    const state = `popup:${rawState}`
    const dialogUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=email,public_profile&response_type=code&state=${encodeURIComponent(state)}`

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

    // Fallback: nếu popup bị chặn hoàn toàn bởi trình duyệt
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      const fallbackState = `redirect:${rawState}`
      const fallbackUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=email,public_profile&response_type=code&state=${encodeURIComponent(fallbackState)}`
      window.location.href = fallbackUrl
      return
    }

    let handled = false
    let timer: NodeJS.Timeout | null = null
    let channel: BroadcastChannel | null = null

    const cleanup = () => {
      if (timer) clearInterval(timer)
      window.removeEventListener("message", handlePostMessage)
      window.removeEventListener("storage", handleStorageEvent)
      if (channel) {
        channel.close()
        channel = null
      }
    }

    const handleOAuthResult = async (data: { type: string; code?: string; state?: string; error?: string }) => {
      if (handled) return
      handled = true
      cleanup()

      try {
        if (popup && !popup.closed) {
          popup.close()
        }
      } catch {}

      if (data.type === "FACEBOOK_OAUTH_ERROR") {
        setIsLoading(false)
        toast.error(data.error || "Đăng nhập Facebook thất bại.")
        return
      }

      if (data.type === "FACEBOOK_OAUTH_SUCCESS" && data.code) {
        const storedState = sessionStorage.getItem("snapgram_facebook_oauth_state")
        sessionStorage.removeItem("snapgram_facebook_oauth_state")

        const returnedState = data.state?.replace(/^popup:/, "")
        if (storedState && returnedState && storedState !== returnedState) {
          toast.error("Xác thực bảo mật state không khớp. Vui lòng thử lại.")
          setIsLoading(false)
          return
        }

        try {
          const res = await loginFacebook({ code: data.code, redirectUri })
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
      }
    }

    // Kênh 1: BroadcastChannel (hoạt động 100% giữa tabs/windows cùng origin)
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("snapgram_facebook_oauth")
      channel.onmessage = (event) => {
        if (event.data?.type === "FACEBOOK_OAUTH_SUCCESS" || event.data?.type === "FACEBOOK_OAUTH_ERROR") {
          void handleOAuthResult(event.data)
        }
      }
    }

    // Kênh 2: localStorage storage event (fallback đa trình duyệt)
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === "snapgram_facebook_oauth_event" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue)
          localStorage.removeItem("snapgram_facebook_oauth_event")
          if (parsed?.type === "FACEBOOK_OAUTH_SUCCESS" || parsed?.type === "FACEBOOK_OAUTH_ERROR") {
            void handleOAuthResult(parsed)
          }
        } catch {}
      }
    }
    window.addEventListener("storage", handleStorageEvent)

    // Kênh 3: window.postMessage (truyền thống nếu opener còn liên kết)
    const handlePostMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === "FACEBOOK_OAUTH_SUCCESS" || event.data?.type === "FACEBOOK_OAUTH_ERROR") {
        void handleOAuthResult(event.data)
      }
    }
    window.addEventListener("message", handlePostMessage)

    // Giám sát khi người dùng chủ động đóng popup mà chưa hoàn tất
    timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer!)
        setTimeout(() => {
          if (!handled) {
            cleanup()
            setIsLoading(false)
          }
        }, 500)
      }
    }, 600)
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

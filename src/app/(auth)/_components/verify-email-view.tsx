"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, MailCheck, Send, XCircle } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

import SnapgramLogo from "@/components/logo/SnapgramLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authService } from "@/services/auth.service"
import { useAuth } from "@/hooks/use-auth"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const tokenFromQuery = searchParams.get("token") ?? ""
  const { user, isAuthenticated, refreshUser } = useAuth()

  const [manualToken, setManualToken] = useState(tokenFromQuery)
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    tokenFromQuery ? "verifying" : "idle"
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const autoVerifiedRef = useRef(false)

  const handleVerifyToken = useCallback(
    async (rawToken: string) => {
      const trimmed = rawToken.trim()
      if (!trimmed) {
        setErrorMessage("Vui lòng nhập mã xác thực email.")
        setStatus("error")
        return
      }

      setStatus("verifying")
      setErrorMessage(null)
      try {
        await authService.verifyEmail(trimmed)
        await refreshUser()
        setStatus("success")
        toast.success("Email của bạn đã được xác thực thành công!")
      } catch (err: unknown) {
        const msg =
          (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) ||
          "Mã xác thực không hợp lệ hoặc đã hết hạn."
        setErrorMessage(msg)
        setStatus("error")
      }
    },
    [refreshUser]
  )

  useEffect(() => {
    if (tokenFromQuery && !autoVerifiedRef.current) {
      autoVerifiedRef.current = true
      handleVerifyToken(tokenFromQuery)
    }
  }, [tokenFromQuery, handleVerifyToken])

  async function handleSendVerificationEmail() {
    setIsSendingEmail(true)
    try {
      await authService.sendVerificationEmail()
      toast.success("Đã gửi email xác thực! Vui lòng kiểm tra hộp thư của bạn.")
    } catch (err: unknown) {
      const msg =
        (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) ||
        "Không thể gửi email xác thực lúc này."
      toast.error(msg)
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full text-center">
      <SnapgramLogo className="w-[160px] h-auto text-foreground mb-4" />

      {status === "verifying" ? (
        <div className="flex flex-col items-center space-y-3 py-6">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <h1 className="text-base font-semibold text-foreground">Đang xác thực email của bạn...</h1>
          <p className="text-xs text-muted-foreground">Vui lòng đợi trong giây lát.</p>
        </div>
      ) : status === "success" || user?.emailVerified ? (
        <div className="w-full flex flex-col items-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-base font-semibold text-foreground">Xác thực email thành công!</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Địa chỉ email của bạn đã được xác nhận. Tài khoản của bạn hiện đã được bảo vệ đầy đủ.
            </p>
          </div>
          <Button
            asChild
            className="h-11 w-full rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 transition-opacity mt-2"
          >
            <Link href={isAuthenticated ? "/" : "/login"}>
              {isAuthenticated ? "Về trang chủ" : "Đến trang đăng nhập"}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground">
            <MailCheck className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">Xác thực địa chỉ Email</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAuthenticated && user?.email
                ? `Xác nhận địa chỉ ${user.email} bằng mã token nhận được trong email.`
                : "Nhập mã xác thực từ liên kết trong email của bạn để hoàn tất xác nhận."}
            </p>
          </div>

          {status === "error" && errorMessage && (
            <div className="w-full p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-left text-xs text-destructive">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleVerifyToken(manualToken)
            }}
            className="w-full space-y-3"
          >
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Nhập mã token xác thực email"
                className="pl-9 h-12 rounded-xl bg-muted border-transparent focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-xs"
              />
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Xác nhận Email
            </Button>
          </form>

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleSendVerificationEmail}
              disabled={isSendingEmail}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50 pt-1"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Gửi lại email xác thực mới
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-x-4 w-full my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">hoặc</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Link
        href={isAuthenticated ? "/" : "/login"}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {isAuthenticated ? "Quay lại trang chủ" : "Quay lại đăng nhập"}
      </Link>
    </div>
  )
}

export default function VerifyEmailView() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-muted-foreground">Đang tải...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}

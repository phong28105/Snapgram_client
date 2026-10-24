"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react"

import SnapgramLogo from "@/components/logo/SnapgramLogo"
import { Button } from "@/components/ui/button"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { useAuth } from "@/hooks/use-auth"
import { paymentService } from "@/services/payment.service"
import { getErrorMessage } from "@/lib/api"
import { formatBlueTickExpiry, formatVnd } from "@/lib/verified"
import type { PaymentOrderResponse, PaymentStatus } from "@/types/payment.type"

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 10

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Đang chờ xác nhận",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
  REFUNDED: "Hoàn tiền",
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function ResultIcon({
  status,
  hasError,
}: {
  status?: PaymentStatus
  hasError: boolean
}) {
  if (status === "SUCCESS") {
    return (
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" />
      </span>
    )
  }
  if (hasError || (status && status !== "PENDING")) {
    return (
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15">
        <XCircle className="h-9 w-9 text-rose-500" />
      </span>
    )
  }
  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/15">
      <Clock className="h-9 w-9 text-sky-500" />
    </span>
  )
}

function PaymentResultContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const responseCode = searchParams.get("responseCode")
  const signatureValid = searchParams.get("signatureValid")

  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth()

  const [order, setOrder] = useState<PaymentOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pollExhausted, setPollExhausted] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const attemptsRef = useRef(0)
  const refreshedRef = useRef(false)

  const loadOrder = useCallback(
    async (id: string) => {
      try {
        const data = await paymentService.getOrder(id)
        setOrder(data)
        setError(null)
        if (data.status === "SUCCESS" && !refreshedRef.current) {
          refreshedRef.current = true
          await refreshUser()
        }
        return data
      } catch (err) {
        setError(getErrorMessage(err, "Không thể tải trạng thái đơn hàng."))
        return null
      }
    },
    [refreshUser]
  )

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    if (!orderId) {
      setIsLoading(false)
      setError("Không tìm thấy mã đơn hàng trong đường dẫn thanh toán.")
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    attemptsRef.current = 0
    setPollExhausted(false)
    setIsLoading(true)

    const poll = async () => {
      const data = await loadOrder(orderId)
      if (cancelled) return
      setIsLoading(false)

      if (data?.status === "PENDING") {
        if (attemptsRef.current < MAX_POLL_ATTEMPTS) {
          attemptsRef.current += 1
          timer = setTimeout(poll, POLL_INTERVAL_MS)
        } else {
          setPollExhausted(true)
        }
      }
    }

    poll()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated, loadOrder, orderId, retryKey])

  // Sau khi đơn SUCCESS, auth-service có thể cần thêm vài giây để cấp Blue Tick qua Kafka.
  useEffect(() => {
    if (order?.status !== "SUCCESS" || user?.verified) return
    let attempts = 0
    const timer = setInterval(async () => {
      attempts += 1
      await refreshUser()
      if (attempts >= 3) clearInterval(timer)
    }, 3000)
    return () => clearInterval(timer)
  }, [order?.status, refreshUser, user?.verified])

  const retry = () => {
    attemptsRef.current = 0
    refreshedRef.current = false
    setPollExhausted(false)
    setError(null)
    setIsLoading(true)
    setRetryKey((key) => key + 1)
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const expiry = formatBlueTickExpiry(user?.verifiedUntil)
  const redirectPath = orderId
    ? `/payment/result?orderId=${encodeURIComponent(orderId)}`
    : "/payment/result"
  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`

  if (!isAuthenticated) {
    return (
      <PageFrame title="Phiên đăng nhập đã hết hạn">
        <div className="text-center space-y-4">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </span>
          <p className="text-sm text-muted-foreground">
            Đăng nhập lại để xem kết quả thanh toán. Đơn hàng của bạn vẫn được giữ nguyên.
          </p>
          <Button asChild className="w-full h-11 rounded-xl">
            <Link href={loginHref}>Đăng nhập</Link>
          </Button>
        </div>
      </PageFrame>
    )
  }

  const status = order?.status
  const isSuccess = status === "SUCCESS"
  const isPending = !order && !error ? true : status === "PENDING"
  const hasError = Boolean(error)

  const title = isLoading
    ? "Đang xác nhận thanh toán..."
    : hasError && !order
      ? "Không thể xác minh đơn hàng"
      : isSuccess
        ? "Thanh toán thành công"
        : isPending
          ? pollExhausted
            ? "Chưa nhận được xác nhận"
            : "Đang xác nhận thanh toán..."
          : status === "CANCELLED"
            ? "Bạn đã hủy thanh toán"
            : status === "EXPIRED"
              ? "Đơn thanh toán đã hết hạn"
              : status === "REFUNDED"
                ? "Đơn hàng đã được hoàn tiền"
                : "Thanh toán thất bại"

  const description = isLoading
    ? "Vui lòng không đóng trang khi hệ thống đang kiểm tra trạng thái đơn."
    : hasError && !order
      ? error || "Vui lòng thử lại hoặc kiểm tra lịch sử giao dịch."
      : isSuccess
        ? user?.verified
          ? `Blue Tick đã được kích hoạt${expiry ? `, hiệu lực đến ${expiry}` : ""}.`
          : "Thanh toán đã được xác nhận. Blue Tick đang được kích hoạt cho tài khoản của bạn..."
        : isPending
          ? pollExhausted
            ? "Cổng thanh toán chưa gửi xác nhận. Bạn có thể thử lại sau ít giây."
            : "Hệ thống đang chờ xác nhận từ cổng thanh toán. Trang sẽ tự cập nhật."
          : status === "CANCELLED"
            ? "Bạn có thể tạo đơn mới nếu vẫn muốn sở hữu Blue Tick."
            : status === "EXPIRED"
              ? "Đơn đã quá thời gian thanh toán. Hãy tạo đơn mới."
              : status === "REFUNDED"
                ? "Khoản thanh toán đã được hoàn lại."
                : "Giao dịch không thành công. Bạn có thể thử lại."

  return (
    <PageFrame title="Kết quả thanh toán">
      <div className="text-center space-y-4">
        {isLoading ? (
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/15">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </span>
        ) : (
          <div className="mx-auto w-fit">
            <ResultIcon status={status} hasError={hasError && !order} />
          </div>
        )}

        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        {isSuccess && (
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
            {user?.verified ? (
              <VerifiedBadge verified size={15} />
            ) : (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            {user?.verified
              ? `${user.username} đã có tích xanh`
              : "Đang kích hoạt tích xanh cho tài khoản..."}
          </div>
        )}

        {signatureValid === "false" && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left text-[11px] text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Chữ ký phản hồi từ cổng thanh toán không hợp lệ. Trạng thái đơn hiển thị ở trên
              được lấy trực tiếp từ máy chủ Snapgram.
            </span>
          </div>
        )}

        {order && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-left text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Mã đơn</span>
              <span className="font-mono font-medium truncate max-w-[200px]" title={order.orderId}>
                {order.orderId}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Số tiền</span>
              <span className="font-semibold">{formatVnd(order.amount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Trạng thái</span>
              <span className="font-semibold">{STATUS_LABEL[order.status]}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Tạo lúc</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            {responseCode && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Mã phản hồi</span>
                <span className="font-mono">{responseCode}</span>
              </div>
            )}
          </div>
        )}

        {hasError && order && (
          <p className="text-[11px] text-rose-500">{error}</p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          {isSuccess ? (
            <>
              <Button asChild className="w-full h-11 rounded-xl">
                <Link href="/profile">Xem hồ sơ</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full h-11 rounded-xl">
                <Link href="/verified">Gia hạn thêm 30 ngày</Link>
              </Button>
            </>
          ) : isPending && !pollExhausted ? (
            <Button type="button" variant="secondary" disabled className="w-full h-11 rounded-xl gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang chờ xác nhận...
            </Button>
          ) : (
            <>
              <Button type="button" onClick={retry} className="w-full h-11 rounded-xl gap-2">
                <RefreshCw className="h-4 w-4" />
                Kiểm tra lại
              </Button>
              <Button asChild variant="secondary" className="w-full h-11 rounded-xl">
                <Link href="/verified">Về trang mua tích xanh</Link>
              </Button>
            </>
          )}

          <Button asChild variant="ghost" className="w-full h-10 rounded-xl gap-2 text-muted-foreground">
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4" />
              Về trang cá nhân
            </Link>
          </Button>
        </div>
      </div>
    </PageFrame>
  )
}

function PageFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border/60 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Trang chủ</span>
        </Link>
        <SnapgramLogo className="w-24 h-auto text-foreground" />
        <span className="w-16" aria-hidden="true" />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          {children}
        </div>
      </main>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  )
}

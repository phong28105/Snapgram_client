"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ChevronLeft,
  CreditCard,
  History,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { IconRosetteDiscountCheckFilled } from "@tabler/icons-react"
import { toast } from "sonner"

import Sidebar from "@/app/(home)/_components/sidebar"
import Navbar from "@/app/(home)/_components/navbar"
import Navbot from "@/app/(home)/_components/navbot"
import { Button } from "@/components/ui/button"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { useAuth } from "@/hooks/use-auth"
import { useLoginModal } from "@/components/providers/login-modal-provider"
import { paymentService } from "@/services/payment.service"
import { getErrorMessage } from "@/lib/api"
import {
  BLUE_TICK_BENEFITS,
  BLUE_TICK_PRODUCT,
  formatBlueTickExpiry,
  formatVnd,
} from "@/lib/verified"
import type { PaymentOrderResponse, PaymentProvider, PaymentStatus } from "@/types/payment.type"

const PROVIDERS: { id: PaymentProvider; name: string; description: string; badgeClass: string; mark: string }[] = [
  {
    id: "MOMO",
    name: "MoMo",
    description: "Ví điện tử MoMo",
    badgeClass: "bg-pink-500",
    mark: "MoMo",
  },
  {
    id: "VNPAY",
    name: "VNPAY",
    description: "Cổng thanh toán VNPAY",
    badgeClass: "bg-blue-600",
    mark: "VN",
  },
]

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Đang chờ",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
  REFUNDED: "Hoàn tiền",
}

const STATUS_CLASS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  SUCCESS: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto pb-12">
        <Navbar />
        <main className="px-4 md:px-12 pt-6 md:pt-10 w-full max-w-4xl mx-auto">{children}</main>
        <Navbot />
      </div>
    </div>
  )
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

export default function VerifiedPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { openLoginModal } = useLoginModal()

  const [provider, setProvider] = useState<PaymentProvider>("MOMO")
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [orders, setOrders] = useState<PaymentOrderResponse[]>([])

  const isActive = Boolean(user?.verified)
  const expiry = formatBlueTickExpiry(user?.verifiedUntil)
  const hasExpired = !isActive && Boolean(user?.verifiedUntil)

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    paymentService
      .listMyOrders(0, 5)
      .then((page) => {
        if (!cancelled) setOrders(page.content || [])
      })
      .catch(() => {
        // Lịch sử chỉ là thông tin phụ, không chặn luồng mua.
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    if (isPurchasing) return

    setIsPurchasing(true)
    try {
      const res =
        provider === "MOMO"
          ? await paymentService.createMomo()
          : await paymentService.createVnpay()

      if (!res.paymentUrl) {
        throw new Error("Không nhận được đường dẫn thanh toán từ máy chủ.")
      }
      window.location.assign(res.paymentUrl)
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tạo đơn thanh toán. Vui lòng thử lại."))
      setIsPurchasing(false)
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <div className="py-20 text-center space-y-4">
          <IconRosetteDiscountCheckFilled size={44} className="mx-auto text-sky-500" />
          <h1 className="text-xl font-semibold">Đăng nhập để mua tích xanh</h1>
          <p className="text-sm text-muted-foreground">
            Bạn cần đăng nhập để xem trạng thái và mua Blue Tick.
          </p>
          <Button onClick={openLoginModal}>Đăng nhập</Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="flex items-center gap-2 mb-8">
        <Link
          href="/profile"
          aria-label="Quay lại trang cá nhân"
          className="p-2 -ml-2 rounded-full hover:bg-muted transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-base font-semibold tracking-tight">Snapgram Verified</h1>
          <p className="text-xs text-muted-foreground">Tích xanh cho tài khoản của bạn</p>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
            <IconRosetteDiscountCheckFilled size={14} />
            Blue Tick
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
              Xác minh tài khoản,
              <br />
              nổi bật giữa cộng đồng.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xl">
              Tích xanh giúp mọi người nhận ra tài khoản chính thức của bạn ngay cạnh tên
              người dùng. Huy hiệu được cộng dồn thời hạn mỗi khi bạn gia hạn.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4">
            <img
              src={user?.avatarUrl || "/profile.jpg"}
              alt={user?.username || "avatar"}
              className="w-11 h-11 rounded-full object-cover bg-muted"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold truncate">{user?.username}</span>
                <VerifiedBadge
                  verified={user?.verified}
                  verifiedUntil={user?.verifiedUntil}
                  size={15}
                />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {isActive
                  ? `Đang hoạt động${expiry ? ` đến ${expiry}` : ""}`
                  : hasExpired
                    ? `Đã hết hạn${expiry ? ` ngày ${expiry}` : ""} — gia hạn để cộng dồn 30 ngày`
                    : "Chưa kích hoạt Blue Tick"}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {BLUE_TICK_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <Sparkles className="w-3 h-3" />
                </span>
                <span className="text-foreground/90">{benefit}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="lg:sticky lg:top-8">
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Gói Blue Tick
                </p>
                <p className="text-3xl font-semibold tracking-tight mt-1">
                  {formatVnd(BLUE_TICK_PRODUCT.price)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  / {BLUE_TICK_PRODUCT.durationDays} ngày · gia hạn cộng dồn
                </p>
              </div>
              <IconRosetteDiscountCheckFilled size={38} className="text-sky-500 shrink-0" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold">Chọn phương thức thanh toán</p>
              {PROVIDERS.map((item) => {
                const selected = provider === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProvider(item.id)}
                    aria-pressed={selected}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/30"
                        : "border-border hover:border-foreground/20 hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ${item.badgeClass}`}
                    >
                      {item.mark}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-sky-500" : "border-muted-foreground/40"
                      }`}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-sky-500" />}
                    </span>
                  </button>
                )
              })}
            </div>

            <Button
              type="button"
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full h-11 rounded-xl text-sm font-semibold gap-2"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tạo đơn...
                </>
              ) : (
                <>
                  {isActive ? "Gia hạn thêm 30 ngày" : "Mua tích xanh"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="space-y-2 text-[11px] text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Thanh toán an toàn qua cổng MoMo / VNPAY.
              </p>
              <p className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                Blue Tick kích hoạt sau khi thanh toán được xác nhận.
              </p>
            </div>
          </div>
        </section>
      </div>

      {orders.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Lịch sử giao dịch</h2>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/70">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{order.orderId}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDateTime(order.createdAt)} · {formatVnd(order.amount)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[order.status]}`}
                >
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}

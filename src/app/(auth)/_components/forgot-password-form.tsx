"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react"
import axios from "axios"

import SnapgramLogo from "@/components/logo/SnapgramLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/validation/auth.schema"
import { authService } from "@/services/auth.service"

export default function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordInput) {
    try {
      await authService.forgotPassword({ email: values.email.trim() })
      setSubmittedEmail(values.email.trim())
    } catch (err: unknown) {
      const errorMsg =
        (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) ||
        "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau."
      form.setError("root", { message: errorMsg })
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <SnapgramLogo className="w-[160px] h-auto text-foreground mb-4" />

      {!submittedEmail ? (
        <>
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-foreground">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-1 text-center">
            Bạn gặp sự cố khi đăng nhập?
          </h1>
          <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn liên kết hoặc mã để đặt lại mật khẩu.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gmail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="Nhập gmail của bạn"
                          autoComplete="email"
                          className="pl-9 h-12 rounded-xl bg-muted border-transparent focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-sm text-destructive text-center -mt-1">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-12 w-full rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 active:opacity-80 transition-opacity"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  "Gửi liên kết đặt lại"
                )}
              </Button>
            </form>
          </Form>
        </>
      ) : (
        <div className="w-full flex flex-col items-center text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-foreground">Đã gửi yêu cầu đặt lại mật khẩu</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nếu địa chỉ <span className="font-medium text-foreground">{submittedEmail}</span> tồn tại trong hệ thống,
              bạn sẽ nhận được hướng dẫn đặt lại mật khẩu (hiệu lực trong 15 phút).
            </p>
          </div>

          <div className="w-full pt-2 space-y-2.5">
            <Button
              asChild
              className="h-11 w-full rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 transition-opacity"
            >
              <Link href="/reset-password">Nhập mã đặt lại mật khẩu</Link>
            </Button>

            <button
              type="button"
              onClick={() => {
                setSubmittedEmail(null)
                form.reset()
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors block w-full py-1"
            >
              Thử lại với email khác
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-x-4 w-full my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">hoặc</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Link
        href="/register"
        className="text-xs font-semibold text-foreground hover:opacity-75 transition-opacity mb-6"
      >
        Tạo tài khoản mới
      </Link>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập
      </Link>
    </div>
  )
}

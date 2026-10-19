"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

import SnapgramLogo from "@/components/logo/SnapgramLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { resetPasswordSchema, type ResetPasswordInput } from "@/validation/auth.schema"
import { authService } from "@/services/auth.service"

function ResetPasswordFormContent() {
  const searchParams = useSearchParams()
  const tokenFromQuery = searchParams.get("token") ?? ""

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromQuery,
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (tokenFromQuery) {
      form.setValue("token", tokenFromQuery)
    }
  }, [tokenFromQuery, form])

  async function onSubmit(values: ResetPasswordInput) {
    try {
      await authService.resetPassword({
        token: values.token.trim(),
        newPassword: values.newPassword,
      })
      setIsSuccess(true)
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.")
    } catch (err: unknown) {
      const errorMsg =
        (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) ||
        "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại."
      form.setError("root", { message: errorMsg })
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <SnapgramLogo className="w-[160px] h-auto text-foreground mb-4" />

      {!isSuccess ? (
        <>
          <h1 className="text-lg font-semibold text-foreground mb-1 text-center">
            Đặt lại mật khẩu mới
          </h1>
          <p className="text-xs text-muted-foreground text-center mb-6 leading-relaxed">
            Nhập mật khẩu mới cho tài khoản của bạn. Sau khi đổi mật khẩu, tất cả thiết bị cũ sẽ tự động đăng xuất.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-y-4">
              {!tokenFromQuery && (
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã xác nhận (Reset Token)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            type="text"
                            placeholder="Dán token nhận được từ email"
                            autoComplete="off"
                            className="pl-9 h-12 rounded-xl bg-muted border-transparent focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-xs"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Tối thiểu 8 ký tự"
                          autoComplete="new-password"
                          className="pl-9 pr-10 h-12 rounded-xl bg-muted border-transparent focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu mới"
                          autoComplete="new-password"
                          className="pl-9 pr-10 h-12 rounded-xl bg-muted border-transparent focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
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
                    Đang cập nhật...
                  </>
                ) : (
                  "Xác nhận đổi mật khẩu"
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
            <h2 className="text-base font-semibold text-foreground">Mật khẩu đã được đặt lại!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn có thể sử dụng mật khẩu mới để đăng nhập vào tài khoản Snapgram ngay bây giờ.
            </p>
          </div>

          <Button
            asChild
            className="h-11 w-full rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 transition-opacity mt-2"
          >
            <Link href="/login">Đến trang đăng nhập</Link>
          </Button>
        </div>
      )}

      <div className="flex items-center gap-x-4 w-full my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">hoặc</span>
        <div className="flex-1 h-px bg-border" />
      </div>

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

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-muted-foreground">Đang tải...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  )
}

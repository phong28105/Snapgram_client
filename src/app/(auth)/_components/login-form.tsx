"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react"

import SnapgramLogo from "@/components/logo/SnapgramLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { loginSchema, twoFaSchema, type LoginInput, type TwoFaInput } from "@/validation/auth.schema"
import { useAuth } from "@/hooks/use-auth"
import axios from "axios"

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps = {}) {
  const { login, login2Fa } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [requiresTwoFa, setRequiresTwoFa] = useState(false)
  const [tempToken, setTempToken] = useState<string | null>(null)

  const handleLoginSuccess = () => {
    if (onSuccess) {
      onSuccess()
      return
    }
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
    const redirect = params?.get("redirect")
    window.location.href = redirect && redirect.startsWith("/") ? redirect : "/"
  }

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const twoFaForm = useForm<TwoFaInput>({
    resolver: zodResolver(twoFaSchema),
    defaultValues: { code: "" },
  })

  async function onLoginSubmit(values: LoginInput) {
    try {
      const res = await login(values)
      if (res?.requiresTwoFa && res.tempToken) {
        setTempToken(res.tempToken)
        setRequiresTwoFa(true)
        return
      }
      handleLoginSuccess()
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        // Anti-brute force / anti-enumeration message chuẩn hóa
        loginForm.setError("root", {
          message: "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.",
        })
      } else {
        const errorMsg =
          (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) ||
          "Đăng nhập thất bại. Vui lòng thử lại sau."
        loginForm.setError("root", { message: errorMsg })
      }
    }
  }

  async function onTwoFaSubmit(values: TwoFaInput) {
    if (!tempToken) return
    const code = values.code.trim()
    const isTotp = /^\d{6}$/.test(code)
    try {
      await login2Fa({
        tempToken,
        ...(isTotp ? { totpCode: code } : { backupCode: code }),
      })
      handleLoginSuccess()
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        twoFaForm.setError("root", {
          message: "Mã xác thực 2FA không chính xác hoặc đã hết hạn.",
        })
      } else {
        const errorMsg =
          (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) ||
          "Xác thực 2FA thất bại. Vui lòng thử lại."
        twoFaForm.setError("root", { message: errorMsg })
      }
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <SnapgramLogo className="w-[160px] h-auto text-foreground mb-6" />

      {!requiresTwoFa ? (
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="w-full flex flex-col gap-y-4">
            <FormField
              control={loginForm.control}
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

            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        autoComplete="current-password"
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

            <div className="flex justify-end -mt-1">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {loginForm.formState.errors.root && (
              <p className="text-sm text-destructive text-center -mt-1">
                {loginForm.formState.errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={loginForm.formState.isSubmitting}
              className="h-12 w-full rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 active:opacity-80 transition-opacity"
            >
              {loginForm.formState.isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <ShieldCheck className="w-6 h-6" />
            <h3 className="font-semibold text-lg">Xác thực 2 bước (2FA)</h3>
          </div>
          <p className="text-xs text-muted-foreground text-center mb-6">
            Tài khoản đã kích hoạt 2FA. Vui lòng nhập mã TOTP (6 số) từ ứng dụng xác thực hoặc mã dự phòng (Backup Code).
          </p>

          <Form {...twoFaForm}>
            <form onSubmit={twoFaForm.handleSubmit(onTwoFaSubmit)} className="w-full flex flex-col gap-y-4">
              <FormField
                control={twoFaForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã xác thực</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="text"
                          placeholder="Nhập 6 số hoặc backup code"
                          autoComplete="one-time-code"
                          className="pl-9 h-12 rounded-xl bg-muted border-transparent focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 tracking-widest text-center text-lg font-mono"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {twoFaForm.formState.errors.root && (
                <p className="text-sm text-destructive text-center -mt-1">
                  {twoFaForm.formState.errors.root.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={twoFaForm.formState.isSubmitting}
                className="h-12 w-full rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 active:opacity-80 transition-opacity"
              >
                {twoFaForm.formState.isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  "Xác nhận 2FA"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setRequiresTwoFa(false)
                  setTempToken(null)
                }}
                className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors mt-2"
              >
                Quay lại đăng nhập
              </button>
            </form>
          </Form>
        </div>
      )}

      <div className="flex items-center gap-x-4 w-full my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">hoặc</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <p className="text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="text-foreground font-semibold hover:opacity-70 transition-opacity">
          Đăng ký
        </Link>
      </p>
    </div>
  )
}

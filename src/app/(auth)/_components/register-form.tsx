"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AtSign, Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react"

import SnapgramLogo from "@/components/logo/SnapgramLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { registerSchema, type RegisterInput } from "@/validation/auth.schema"
import { authService } from "@/services/auth.service"
import { useAuth } from "@/hooks/use-auth"
import axios from "axios"

export default function RegisterForm() {
  const { refreshUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", displayName: "", username: "", password: "" },
  })

  async function onSubmit(values: RegisterInput) {
    try {
      await authService.register(values)
      await refreshUser()
      window.location.href = "/"
    } catch (err: unknown) {
      const errorMsg =
        (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin."
      form.setError("root", { message: errorMsg })
    }
  }

  const fields = [
    { name: "email" as const, label: "Gmail", placeholder: "Nhập gmail của bạn", type: "email", autoComplete: "email", icon: <Mail className="w-4 h-4" /> },
    { name: "displayName" as const, label: "Tên hiển thị", placeholder: "Tên của bạn", type: "text", autoComplete: "name", icon: <UserRound className="w-4 h-4" /> },
    { name: "username" as const, label: "Username", placeholder: "vd: snapgram.user", type: "text", autoComplete: "username", icon: <AtSign className="w-4 h-4" /> },
  ]

  return (
    <div className="flex flex-col items-center w-full">
      <SnapgramLogo className="w-[160px] h-auto text-foreground mb-2" />
      <p className="text-sm text-muted-foreground text-center mb-8">Đăng ký để xem ảnh và video của bạn bè.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-y-4">
          {fields.map(({ name, label, placeholder, type, autoComplete, icon }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</span>
                      <Input
                        type={type}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        className="pl-9 h-12 rounded-xl bg-muted border-transparent focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu</FormLabel>
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

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Khi đăng ký, bạn đồng ý với{" "}
            <Link href="#" className="text-foreground hover:underline">Điều khoản</Link>{" "}và{" "}
            <Link href="#" className="text-foreground hover:underline">Chính sách quyền riêng tư</Link>{" "}
            của Snapgram.
          </p>

          {form.formState.errors.root && (
            <p className="text-sm text-destructive text-center -mt-1">{form.formState.errors.root.message}</p>
          )}

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-12 w-full rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 active:opacity-80 transition-opacity"
          >
            {form.formState.isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang đăng ký...
              </>
            ) : "Đăng ký"}
          </Button>
        </form>
      </Form>

      <div className="flex items-center gap-x-4 w-full my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">hoặc</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <p className="text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-foreground font-semibold hover:opacity-70 transition-opacity">
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}

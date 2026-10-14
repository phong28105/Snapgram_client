"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import LoginForm from "@/app/(auth)/_components/login-form"

export default function LoginInterceptedPage() {
  const router = useRouter()
  return (
    <Dialog open onOpenChange={(open) => { if (!open) router.back() }}>
      <DialogContent className="sm:max-w-[420px] p-8 rounded-2xl border-border bg-background">
        <DialogTitle className="sr-only">Đăng nhập Snapgram</DialogTitle>
        <LoginForm />
      </DialogContent>
    </Dialog>
  )
}
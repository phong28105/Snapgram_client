"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import LoginForm from "@/app/(auth)/_components/login-form"

// ─── Context ───────────────────────────────────────────────────────────────────

interface LoginModalContextValue {
  openLoginModal: () => void
  closeLoginModal: () => void
}

const LoginModalContext = createContext<LoginModalContextValue>({
  openLoginModal: () => {},
  closeLoginModal: () => {},
})

// ─── Provider ──────────────────────────────────────────────────────────────────

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Tự đóng modal khi điều hướng sang route khác (ví dụ /forgot-password, /register)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <LoginModalContext.Provider
      value={{
        openLoginModal: () => setIsOpen(true),
        closeLoginModal: () => setIsOpen(false),
      }}
    >
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[420px] p-8 rounded-2xl border-border bg-background">
          <DialogTitle className="sr-only">Đăng nhập Snapgram</DialogTitle>
          <LoginForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </LoginModalContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useLoginModal() {
  return useContext(LoginModalContext)
}

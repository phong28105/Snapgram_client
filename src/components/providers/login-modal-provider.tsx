"use client"

import { createContext, useContext, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import LoginForm from "@/app/(auth)/_components/login-form"

// ─── Context ───────────────────────────────────────────────────────────────────

interface LoginModalContextValue {
  openLoginModal: () => void
}

const LoginModalContext = createContext<LoginModalContextValue>({
  openLoginModal: () => {},
})

// ─── Provider ──────────────────────────────────────────────────────────────────

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <LoginModalContext.Provider value={{ openLoginModal: () => setIsOpen(true) }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[420px] p-8 rounded-2xl border-border bg-background">
          <DialogTitle className="sr-only">Đăng nhập Snapgram</DialogTitle>
          <LoginForm />
        </DialogContent>
      </Dialog>
    </LoginModalContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useLoginModal() {
  return useContext(LoginModalContext)
}

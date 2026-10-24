"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react"
import { authService } from "@/services/auth.service"
import { userService } from "@/services/user.service"
import type {
  LoginPayload,
  LoginResponse,
  TwoFaPayload,
  UserMe,
  UserRole,
} from "@/types/auth.type"

export interface AuthContextType {
  user: UserMe | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (params: LoginPayload) => Promise<LoginResponse>
  login2Fa: (params: TwoFaPayload) => Promise<LoginResponse>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserMe | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const isFetchingRef = useRef(false)

  const fetchCurrentUser = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const data = await authService.getMe()
      setUser(data)
    } catch (err: unknown) {
      // Chỉ hủy user session khi nhận 401 Unauthorized (token hết hạn/sai)
      // Nếu là lỗi 429 (Rate Limit) hoặc network timeout thì giữ nguyên state để không kick người dùng ra login
      const axiosStatus = (err as { response?: { status?: number } })?.response?.status
      if (axiosStatus === 401) {
        setUser(null)
      }
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  // Gửi heartbeat định kỳ mỗi 2 phút khi đã đăng nhập
  useEffect(() => {
    if (!user) return
    userService.heartbeat().catch(() => {})
    const timer = setInterval(() => {
      userService.heartbeat().catch(() => {})
    }, 120_000)
    return () => clearInterval(timer)
  }, [user])

  const login = async (params: LoginPayload): Promise<LoginResponse> => {
    const res = await authService.login(params)
    if (res.requiresTwoFa) {
      return res
    }
    if (res.user) {
      setUser(res.user)
    }
    try {
      await fetchCurrentUser()
    } catch {
      // Giữ user từ response login nếu getMe gặp độ trễ
    }
    return res
  }

  const login2Fa = async (params: TwoFaPayload): Promise<LoginResponse> => {
    const res = await authService.login2Fa(params)
    if (res.user) {
      setUser(res.user)
    }
    try {
      await fetchCurrentUser()
    } catch {
      // Giữ user từ response login nếu getMe gặp độ trễ
    }
    return res
  }

  const logout = async () => {
    setUser(null)
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }

  // Chuẩn hóa role (hỗ trợ cả ADMIN, ROLE_ADMIN, SUPER_ADMIN)
  const normalizedRole = useMemo(() => {
    if (!user?.role) return null
    const r = String(user.role).toUpperCase()
    if (r === "ADMIN" || r === "ROLE_ADMIN" || r === "SUPER_ADMIN") return "ADMIN"
    if (r === "USER" || r === "ROLE_USER") return "USER"
    return user.role
  }, [user?.role])

  return (
    <AuthContext.Provider
      value={{
        user,
        role: normalizedRole,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        login2Fa,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

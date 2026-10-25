"use client"

import React, { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, KeyRound, Loader2, Lock, Mail, ShieldAlert, ShieldCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/api"
import { userService } from "@/services/user.service"
import type {
  BlockedUserResponse,
  TwoFaSetupResponse,
  UserProfileResponse,
} from "@/types/user.type"

interface AccountSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfileResponse | null
  onProfileUpdated?: (updated: UserProfileResponse) => void
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
  profile,
  onProfileUpdated,
}: AccountSettingsDialogProps) {
  // Privacy & Activity state
  const [privateAccount, setPrivateAccount] = useState(false)
  const [showActivityStatus, setShowActivityStatus] = useState(true)
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Change Email state
  const [newEmail, setNewEmail] = useState("")
  const [emailPassword, setEmailPassword] = useState("")
  const [isChangingEmail, setIsChangingEmail] = useState(false)

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [twoFaSetupData, setTwoFaSetupData] = useState<TwoFaSetupResponse | null>(null)
  const [totpCode, setTotpCode] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [isLoading2Fa, setIsLoading2Fa] = useState(false)

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserResponse[]>([])
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false)

  useEffect(() => {
    if (profile) {
      setPrivateAccount(Boolean(profile.privateAccount))
      setShowActivityStatus(profile.showActivityStatus ?? true)
      setTwoFaEnabled(Boolean(profile.twoFaEnabled))
    }
  }, [profile])

  const fetchBlockedUsers = useCallback(async () => {
    setIsLoadingBlocks(true)
    try {
      const res = await userService.getBlockedUsers(0, 50)
      setBlockedUsers(res.content || [])
    } catch {
      // Ignore if empty or error
    } finally {
      setIsLoadingBlocks(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchBlockedUsers()
    }
  }, [open, fetchBlockedUsers])

  const handleTogglePrivacy = async (checked: boolean) => {
    setIsSavingPrivacy(true)
    try {
      const updated = await userService.updatePrivacy({ privateAccount: checked })
      setPrivateAccount(Boolean(updated.privateAccount))
      onProfileUpdated?.(updated)
      toast.success(
        checked ? "Đã chuyển sang tài khoản riêng tư" : "Đã chuyển sang tài khoản công khai"
      )
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể cập nhật quyền riêng tư."))
    } finally {
      setIsSavingPrivacy(false)
    }
  }

  const handleToggleActivityStatus = async (checked: boolean) => {
    setIsSavingPrivacy(true)
    try {
      const updated = await userService.updateActivityStatus({ showActivityStatus: checked })
      setShowActivityStatus(Boolean(updated.showActivityStatus))
      onProfileUpdated?.(updated)
      toast.success("Đã cập nhật cài đặt trạng thái hoạt động")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể cập nhật trạng thái hoạt động."))
    } finally {
      setIsSavingPrivacy(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có tối thiểu 8 ký tự.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.")
      return
    }

    setIsChangingPassword(true)
    try {
      await userService.changePassword({ currentPassword, newPassword })
      toast.success("Đổi mật khẩu thành công!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.error(getErrorMessage(err, "Mật khẩu hiện tại không đúng hoặc không hợp lệ."))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim() || !emailPassword) return
    setIsChangingEmail(true)
    try {
      await userService.requestEmailChange({
        newEmail: newEmail.trim(),
        currentPassword: emailPassword,
      })
      toast.success("Đã gửi liên kết xác nhận tới email mới của bạn!")
      setNewEmail("")
      setEmailPassword("")
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể gửi yêu cầu đổi email."))
    } finally {
      setIsChangingEmail(false)
    }
  }

  const handleStart2FaSetup = async () => {
    setIsLoading2Fa(true)
    try {
      const res = await userService.setup2Fa()
      setTwoFaSetupData(res)
      setBackupCodes(null)
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể khởi tạo 2FA."))
    } finally {
      setIsLoading2Fa(false)
    }
  }

  const handleEnable2Fa = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = totpCode.trim()
    if (!/^\d{6}$/.test(cleanCode)) {
      toast.error("Mã TOTP phải gồm đúng 6 chữ số.")
      return
    }
    setIsLoading2Fa(true)
    try {
      const res = await userService.enable2Fa({ totpCode: cleanCode })
      setTwoFaEnabled(true)
      setBackupCodes(res.backupCodes || [])
      setTwoFaSetupData(null)
      setTotpCode("")
      if (profile) {
        onProfileUpdated?.({ ...profile, twoFaEnabled: true })
      }
      toast.success("Đã bật xác thực 2 bước (2FA) thành công!")
    } catch (err) {
      toast.error(getErrorMessage(err, "Mã TOTP không chính xác."))
    } finally {
      setIsLoading2Fa(false)
    }
  }

  const handleDisable2Fa = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = disableCode.trim()
    if (!clean) {
      toast.error("Vui lòng nhập mã TOTP hoặc Backup Code.")
      return
    }
    setIsLoading2Fa(true)
    try {
      const isTotp = /^\d{6}$/.test(clean)
      await userService.disable2Fa(isTotp ? { totpCode: clean } : { backupCode: clean })
      setTwoFaEnabled(false)
      setDisableCode("")
      setBackupCodes(null)
      if (profile) {
        onProfileUpdated?.({ ...profile, twoFaEnabled: false })
      }
      toast.success("Đã tắt xác thực 2 bước (2FA).")
    } catch (err) {
      toast.error(getErrorMessage(err, "Mã xác nhận không đúng."))
    } finally {
      setIsLoading2Fa(false)
    }
  }

  const handleUnblock = async (targetId: string, username: string) => {
    try {
      await userService.unblockUser(targetId)
      setBlockedUsers((prev) => prev.filter((u) => u.userId !== targetId))
      toast.success(`Đã bỏ chặn @${username}`)
      window.dispatchEvent(
        new CustomEvent("snapgram:block-updated", {
          detail: { userId: targetId, username, blocked: false },
        })
      )
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể bỏ chặn người dùng."))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-background border-border rounded-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/60">
          <DialogTitle className="text-base font-semibold">Cài đặt & Quyền riêng tư</DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[78vh] overflow-y-auto">
          <Tabs defaultValue="privacy" className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-5">
              <TabsTrigger value="privacy" className="text-xs">Riêng tư</TabsTrigger>
              <TabsTrigger value="security" className="text-xs">Mật khẩu</TabsTrigger>
              <TabsTrigger value="twofa" className="text-xs">Bảo mật 2FA</TabsTrigger>
              <TabsTrigger value="blocks" className="text-xs">Đã chặn</TabsTrigger>
            </TabsList>

            {/* Tab 1: Privacy & Activity */}
            <TabsContent value="privacy" className="space-y-4">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-card/50">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    Tài khoản riêng tư
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Khi tài khoản ở chế độ riêng tư, chỉ những người bạn chấp thuận mới có thể xem ảnh và video của bạn.
                  </p>
                </div>
                <Checkbox
                  checked={privateAccount}
                  disabled={isSavingPrivacy}
                  onCheckedChange={(val) => handleTogglePrivacy(Boolean(val))}
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-card/50">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold">Hiển thị trạng thái hoạt động</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Cho phép những tài khoản bạn theo dõi và bất kỳ ai bạn nhắn tin thấy khi nào bạn hoạt động gần nhất.
                  </p>
                </div>
                <Checkbox
                  checked={showActivityStatus}
                  disabled={isSavingPrivacy}
                  onCheckedChange={(val) => handleToggleActivityStatus(Boolean(val))}
                />
              </div>
            </TabsContent>

            {/* Tab 2: Password & Email */}
            <TabsContent value="security" className="space-y-6">
              <form onSubmit={handleChangePassword} className="space-y-3">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  Đổi mật khẩu
                </h4>
                <Input
                  type="password"
                  placeholder="Mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-10 text-xs"
                  required
                />
                <Input
                  type="password"
                  placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 text-xs"
                  required
                />
                <Input
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 text-xs"
                  required
                />
                <Button type="submit" size="sm" disabled={isChangingPassword} className="w-full text-xs">
                  {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Cập nhật mật khẩu
                </Button>
              </form>

              <div className="h-px bg-border/60" />

              <form onSubmit={handleChangeEmail} className="space-y-3">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Đổi địa chỉ Email {profile?.email ? `(${profile.email})` : ""}
                </h4>
                <Input
                  type="email"
                  placeholder="Nhập địa chỉ email mới"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-10 text-xs"
                  required
                />
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu hiện tại để xác nhận"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="h-10 text-xs"
                  required
                />
                <Button type="submit" variant="secondary" size="sm" disabled={isChangingEmail} className="w-full text-xs">
                  {isChangingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Gửi yêu cầu đổi Email
                </Button>
              </form>
            </TabsContent>

            {/* Tab 3: 2FA */}
            <TabsContent value="twofa" className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-card/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {twoFaEnabled ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-semibold">
                      Xác thực 2 bước (2FA): {twoFaEnabled ? "Đang bật" : "Đang tắt"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Bảo vệ tài khoản bằng ứng dụng Google Authenticator hoặc Authy.
                    </p>
                  </div>
                </div>
              </div>

              {backupCodes && backupCodes.length > 0 && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-emerald-500">
                      Mã dự phòng (Backup Codes) — Hãy lưu lại ngay!
                    </h5>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(backupCodes.join("\n"))
                        toast.success("Đã sao chép toàn bộ mã dự phòng!")
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500 hover:underline"
                    >
                      <Copy className="w-3 h-3" /> Sao chép
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-xs bg-background/80 p-3 rounded-lg">
                    {backupCodes.map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {!twoFaEnabled ? (
                !twoFaSetupData ? (
                  <Button
                    type="button"
                    onClick={handleStart2FaSetup}
                    disabled={isLoading2Fa}
                    className="w-full text-xs"
                  >
                    {isLoading2Fa ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Thiết lập xác thực 2 bước (2FA)
                  </Button>
                ) : (
                  <form onSubmit={handleEnable2Fa} className="space-y-3 border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">
                      1. Quét mã QR bên dưới bằng ứng dụng Authenticator hoặc nhập mã Secret:
                    </p>
                    {twoFaSetupData.qrCodeBase64 && (
                      <div className="flex justify-center bg-white p-3 rounded-xl w-fit mx-auto">
                        <img
                          src={
                            twoFaSetupData.qrCodeBase64.startsWith("data:")
                              ? twoFaSetupData.qrCodeBase64
                              : `data:image/png;base64,${twoFaSetupData.qrCodeBase64}`
                          }
                          alt="2FA QR Code"
                          className="w-40 h-40 object-contain"
                        />
                      </div>
                    )}
                    <div className="p-2 rounded bg-muted font-mono text-[11px] text-center break-all select-all">
                      {twoFaSetupData.secret}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      2. Nhập mã 6 số hiển thị trên ứng dụng để kích hoạt:
                    </p>
                    <Input
                      type="text"
                      placeholder="Nhập mã 6 chữ số (VD: 123456)"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      maxLength={6}
                      className="h-10 text-xs text-center tracking-widest font-mono"
                      required
                    />
                    <Button type="submit" size="sm" disabled={isLoading2Fa} className="w-full text-xs">
                      {isLoading2Fa ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                      Xác nhận & Bật 2FA
                    </Button>
                  </form>
                )
              ) : (
                <form onSubmit={handleDisable2Fa} className="space-y-3 border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">
                    Nhập mã TOTP 6 số hoặc mã dự phòng (Backup Code) để tắt xác thực 2 bước:
                  </p>
                  <Input
                    type="text"
                    placeholder="Mã TOTP 6 số hoặc Backup Code"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    className="h-10 text-xs font-mono"
                    required
                  />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isLoading2Fa}
                    className="w-full text-xs"
                  >
                    {isLoading2Fa ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                    Tắt xác thực 2 bước
                  </Button>
                </form>
              )}
            </TabsContent>

            {/* Tab 4: Blocked Users */}
            <TabsContent value="blocks" className="space-y-3">
              {isLoadingBlocks ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="py-8 text-center space-y-2 text-muted-foreground">
                  <UserX className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-xs">Bạn chưa chặn tài khoản nào.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((b) => (
                    <div
                      key={b.userId}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={b.avatarUrl || "/profile.jpg"}
                          alt={b.username}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold">{b.username}</p>
                          {b.displayName && (
                            <p className="text-[11px] text-muted-foreground">{b.displayName}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(b.userId, b.username)}
                        className="h-8 text-xs"
                      >
                        Bỏ chặn
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

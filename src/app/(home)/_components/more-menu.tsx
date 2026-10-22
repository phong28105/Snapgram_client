"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Settings, Activity, Bookmark, AlertCircle, LogOut, User, BadgeCheck } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { useAuth } from "@/hooks/use-auth"
import { AccountSettingsDialog } from "@/components/profile/account-settings-dialog"
import { useLoginModal } from "@/components/providers/login-modal-provider"

export function MoreMenu() {
  const { user, isAuthenticated, logout, refreshUser } = useAuth()
  const { openLoginModal } = useLoginModal()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <li className="flex items-center xl:my-1 xl:gap-3 xl:p-3 rounded-lg hover:bg-accent cursor-pointer transition max-xl:p-2 max-xl:justify-center group list-none focus:outline-none">
            <div className="relative">
              <Menu className="transition duration-75 xl:w-[22px] xl:h-[22px] max-xl:w-[24px] max-xl:h-[24px] max-xl:group-hover:scale-105" />
            </div>
            <span className="max-xl:hidden text-base font-light">Xem thêm</span>
          </li>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="top" sideOffset={8} className="w-[260px] rounded-2xl p-2">
          <DropdownMenuItem
            onSelect={() => {
              if (!isAuthenticated) openLoginModal()
              else setIsSettingsOpen(true)
            }}
            className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer"
          >
            <Settings className="w-5 h-5" /><span className="text-base font-light">Cài đặt</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer">
            <Link href="/verified">
              <BadgeCheck className="w-5 h-5 text-sky-500" />
              <span className="text-base font-light">Snapgram Verified</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer">
            <Activity className="w-5 h-5" /><span className="text-base font-light">Hoạt động của bạn</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer">
            <Bookmark className="w-5 h-5" /><span className="text-base font-light">Đã lưu</span>
          </DropdownMenuItem>

          <ModeToggle />

          <DropdownMenuItem className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer">
            <AlertCircle className="w-5 h-5" /><span className="text-base font-light">Báo cáo sự cố</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            onSelect={openLoginModal}
            className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer"
          >
            <User className="w-5 h-5" /><span className="text-base font-light">Chuyển tài khoản</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem onSelect={handleLogout} className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
            <LogOut className="w-5 h-5" /><span className="text-base font-light">Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        profile={user}
        onProfileUpdated={() => refreshUser()}
      />
    </>
  )
}

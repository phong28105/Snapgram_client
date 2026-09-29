"use client"

import {
    Menu,
    Settings,
    Activity,
    Bookmark,
    AlertCircle,
    LogOut,
    User,
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "./ui/mode-toggle"


export function MoreMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <li className="flex items-center xl:my-1 xl:gap-3 xl:p-3 rounded-lg hover:bg-accent cursor-pointer transition max-xl:p-2 max-xl:justify-center group list-none focus:outline-none">
                    <div className="relative">
                        <Menu className="transition duration-75 xl:w-[22px] xl:h-[22px] max-xl:w-[24px] max-xl:h-[24px] max-xl:group-hover:scale-105" />
                    </div>
                    <span className="max-xl:hidden text-base font-light">Xem thêm</span>
                </li>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                side="top"
                sideOffset={8}
                className="w-[260px] rounded-2xl p-2"
            >
                <DropdownMenuItem className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer">
                    <Settings className="w-5 h-5" />
                    <span className="text-base font-light">Cài đặt</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer">
                    <Activity className="w-5 h-5" />
                    <span className="text-base font-light">Hoạt động của bạn</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer">
                    <Bookmark className="w-5 h-5" />
                    <span className="text-base font-light">Đã lưu</span>
                </DropdownMenuItem>

                <ModeToggle />

                <DropdownMenuItem className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-base font-light">Báo cáo sự cố</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer">
                    <User className="w-5 h-5" />
                    <span className="text-base font-light">Chuyển tài khoản</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="w-5 h-5" />
                    <span className="text-base font-light">Đăng xuất</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
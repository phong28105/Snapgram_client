"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import {
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

const THEMES = [
    { value: "light", label: "Sáng", icon: Sun },
    { value: "dark", label: "Tối", icon: Moon },
    { value: "system", label: "Theo hệ thống", icon: Monitor },
] as const

export function ModeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => setMounted(true), [])

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent">
                <Moon className="w-5 h-5" />
                <span className="text-base font-light flex-1">Chuyển chế độ</span>
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
                <DropdownMenuSubContent
                    sideOffset={6}
                    className="w-[200px] rounded-2xl p-2 bg-popover text-popover-foreground border border-border shadow-xl"
                >
                    {THEMES.map(({ value, label, icon: Icon }) => (
                        <DropdownMenuItem
                            key={value}
                            onClick={() => setTheme(value)}
                            className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground"
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-base font-light flex-1">{label}</span>
                            {mounted && theme === value && <span>✓</span>}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    )
}
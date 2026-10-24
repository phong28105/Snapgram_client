"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbar from "@/app/(home)/_components/navbar"
import Navbot from "@/app/(home)/_components/navbot"
import { ConversationList } from "@/components/chat/conversation-list"
import { ChatThread } from "@/components/chat/chat-thread"

interface ChatShellProps {
  activeId?: string
}

/**
 * Trang Tin nhắn.
 * - Desktop: 2 cột (danh sách + hội thoại đang mở)
 * - Mobile: 1 cột, chuyển màn hình theo route
 */
export function ChatShell({ activeId }: ChatShellProps) {
  const router = useRouter()

  const handleSelect = (conversationId: string) => {
    router.push(`/messages/${conversationId}`)
  }

  const handleBack = () => {
    router.push("/messages")
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="flex-1 min-h-0 px-0 sm:px-4 sm:py-4 pb-16 md:pb-4">
          <div className="mx-auto w-full max-w-5xl h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)] flex rounded-none sm:rounded-2xl border-0 sm:border sm:border-border overflow-hidden bg-background shadow-sm">
            {/* Cột danh sách: ẩn trên mobile khi đang mở hội thoại */}
            <div
              className={`w-full md:w-[340px] md:border-r md:border-border shrink-0 min-h-0 ${
                activeId ? "hidden md:flex" : "flex"
              } flex-col`}
            >
              <ConversationList activeId={activeId} onSelect={handleSelect} />
            </div>

            {/* Cột hội thoại: chỉ hiện trên mobile khi có activeId */}
            <div
              className={`flex-1 min-w-0 min-h-0 ${
                activeId ? "flex" : "hidden md:flex"
              } flex-col`}
            >
              {activeId ? (
                <ChatThread conversationId={activeId} onBack={handleBack} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 px-6">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/40" />
                  <p className="text-sm font-semibold">Tin nhắn của bạn</p>
                  <p className="text-[11px] text-muted-foreground max-w-[260px]">
                    Chọn một hội thoại ở bên trái hoặc bắt đầu cuộc trò chuyện mới.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Navbot />
      </div>
    </div>
  )
}

export default ChatShell

"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Send } from "lucide-react"
import Sidebar from "@/app/(home)/_components/sidebar"
import Navbar from "@/app/(home)/_components/navbar"
import Navbot from "@/app/(home)/_components/navbot"
import { ConversationList } from "@/components/chat/conversation-list"
import { ChatThread } from "@/components/chat/chat-thread"

interface ChatShellProps {
  activeId?: string
}

/**
 * Trang Tin nhắn — chiếm toàn bộ chiều cao khung app.
 * - Desktop: cột danh sách (360–400px) + vùng hội thoại giãn hết phần còn lại
 * - Mobile: một cột, chuyển màn hình theo route
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
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className={activeId ? "hidden md:block" : "block"}>
          <Navbar />
        </div>

        <div className="flex-1 flex min-h-0 min-w-0 border-t border-border">
          {/* Cột danh sách: ẩn trên mobile khi đang mở hội thoại */}
          <aside
            className={`${
              activeId ? "hidden md:flex" : "flex"
            } w-full md:w-[360px] xl:w-[400px] shrink-0 flex-col min-h-0 md:border-r md:border-border bg-background`}
          >
            <ConversationList activeId={activeId} onSelect={handleSelect} />
          </aside>

          {/* Vùng hội thoại */}
          <section
            className={`${
              activeId ? "flex" : "hidden md:flex"
            } flex-1 min-w-0 min-h-0 flex-col bg-background`}
          >
            {activeId ? (
              <ChatThread conversationId={activeId} onBack={handleBack} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-8">
                <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center">
                  <Send className="w-7 h-7 text-muted-foreground/70 -rotate-12" />
                </div>
                <p className="text-base font-semibold">Tin nhắn của bạn</p>
                <p className="text-xs text-muted-foreground max-w-[300px] leading-relaxed">
                  Chọn một hội thoại ở cột bên trái, hoặc bấm biểu tượng
                  <MessageCircle className="inline w-3.5 h-3.5 mx-1 -rotate-90" />
                  để nhắn cho người bạn đang theo dõi.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className={activeId ? "hidden md:block" : "block"}>
          <Navbot />
        </div>
      </div>
    </div>
  )
}

export default ChatShell

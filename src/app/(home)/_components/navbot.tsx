"use client"

import { sidebarLists } from "@/data"
import DisplayIcon from "@/components/ui/display-icon"
import CreatePost from "@/components/ui/create-post"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"

const Navbot = () => {
  const pathname = usePathname()
  const { user } = useAuth()
  const { unreadTotal: chatUnread } = useChat()

  return (
    <nav className="block md:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.25)]">
      <div className="h-[52px] pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-2 max-w-lg mx-auto">
        <ul className="flex flex-row w-full justify-around items-center">
          {sidebarLists.map((sidebarList, sidebarListIndex) => {
            if (sidebarList.title === "Thông báo") return null

            const isActive = sidebarList.href
              ? sidebarList.href === "/"
                ? pathname === "/"
                : pathname.startsWith(sidebarList.href)
              : false

            const itemWithAvatar =
              sidebarList.title === "Trang cá nhân" && user?.avatarUrl
                ? { ...sidebarList, img: user.avatarUrl, active: isActive }
                : { ...sidebarList, active: isActive }

            if (sidebarList.title === "Tạo") {
              return (
                <CreatePost key={sidebarListIndex}>
                  <li className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-lg hover:bg-accent active:scale-90 transition">
                    <DisplayIcon list={itemWithAvatar} />
                  </li>
                </CreatePost>
              )
            }

            if (sidebarList.title === "Tin nhắn") {
              return (
                <Link key={sidebarListIndex} href="/messages">
                  <li className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-lg hover:bg-accent active:scale-90 transition">
                    <DisplayIcon list={itemWithAvatar} messageCount={chatUnread} />
                  </li>
                </Link>
              )
            }

            const iconContent = (
              <li className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-lg hover:bg-accent active:scale-90 transition">
                <DisplayIcon list={itemWithAvatar} />
              </li>
            )

            if (sidebarList.href) {
              return (
                <Link key={sidebarListIndex} href={sidebarList.href}>
                  {iconContent}
                </Link>
              )
            }

            return <div key={sidebarListIndex}>{iconContent}</div>
          })}
        </ul>
      </div>
    </nav>
  )
}

export default Navbot

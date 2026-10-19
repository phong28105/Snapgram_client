"use client"

import { sidebarLists } from "@/data"
import DisplayIcon from "@/components/ui/display-icon"
import CreatePost from "@/components/ui/create-post"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

const Navbot = () => {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <nav className="block md:hidden sticky bottom-0 z-20">
      <div className="py-3.5 flex items-center bg-background border-t border-border">
        <ul className="flex flex-row w-full justify-evenly items-stretch">
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
                  <li className="cursor-pointer">
                    <DisplayIcon list={itemWithAvatar} />
                  </li>
                </CreatePost>
              )
            }

            if (sidebarList.title === "Tin nhắn") {
              return (
                <li
                  key={sidebarListIndex}
                  onClick={() => toast.info("Tính năng Tin nhắn sẽ sớm ra mắt khi có API!")}
                  className="cursor-pointer"
                >
                  <DisplayIcon list={itemWithAvatar} />
                </li>
              )
            }

            const iconContent = (
              <li className="cursor-pointer">
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

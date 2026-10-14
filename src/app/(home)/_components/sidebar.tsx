import { sidebarLists } from "@/data"
import { Blocks } from "lucide-react"
import DisplayIcon from "@/components/ui/display-icon"
import CreatePost from "@/components/ui/create-post"
import { MoreMenu } from "./more-menu"
import SnapgramLogo from "@/components/logo/SnapgramLogo"
import SnapgramThumb from "@/components/logo/SnapgramThumb"
import Link from "next/link"

const Sidebar = () => {
  return (
    <aside className="sticky top-0 w-[72px] xl:w-[244px] 2xl:w-[335px] max-md:hidden border-r border-border h-screen pb-5 pt-2 px-3">
      <div className="flex flex-col h-full justify-between">
        <div className="flex flex-col">
          <div className="relative mb-[19px] xl:pb-4 xl:px-3 xl:pt-[25px] max-xl:pb-[23px] max-xl:h-[92px]">
            <Link href="/" className="max-xl:absolute max-xl:top-1/2 max-xl:left-1/2 max-xl:-translate-y-1/2 max-xl:-translate-x-1/2 max-xl:p-3 max-xl:hover:bg-accent max-xl:rounded-lg group">
              <div className="max-xl:hidden">
                <SnapgramLogo className="w-[120px] h-auto text-black dark:text-white" />
              </div>
              <SnapgramThumb className="xl:hidden w-6 h-6 text-black dark:text-white transition-transform duration-200 group-hover:scale-105" />
            </Link>
          </div>

          <ul className="flex flex-col max-xl:space-y-4">
            {sidebarLists.map((list, listIndex) => {
              if (list.title === "Tạo") {
                return (
                  <CreatePost key={listIndex}>
                    <li className="flex items-center xl:my-1 xl:gap-3 xl:p-3 rounded-lg hover:bg-gray-200/10 cursor-pointer transition max-xl:p-2 max-xl:justify-center group">
                      <DisplayIcon list={list} />
                      <span className="max-xl:hidden text-base font-light">{list.title}</span>
                    </li>
                  </CreatePost>
                )
              }

              const itemContent = (
                <li className="flex items-center xl:my-1 xl:gap-3 xl:p-3 rounded-lg hover:bg-accent cursor-pointer transition max-xl:p-2 max-xl:justify-center group">
                  <DisplayIcon list={list} />
                  <span className={`max-xl:hidden text-base ${list.active ? "font-bold" : "font-light"} ${list.title.toLowerCase() === "trang chủ" ? "-translate-x-[2.8px]" : ""}`}>
                    {list.title}
                  </span>
                </li>
              )

              if (list.href) {
                return (
                  <Link key={listIndex} href={list.href}>
                    {itemContent}
                  </Link>
                )
              }

              return <div key={listIndex}>{itemContent}</div>
            })}
          </ul>
        </div>

        <ul className="flex flex-col space-y-2">
          <MoreMenu />
          <li className="flex items-center xl:my-1 xl:gap-3 xl:p-3 rounded-lg hover:bg-accent cursor-pointer transition max-xl:p-2 max-xl:justify-center group">
            <Blocks className="transition duration-75 xl:w-[22px] xl:h-[22px] max-xl:w-[24px] max-xl:h-[24px] max-xl:group-hover:scale-105" />
            <span className="max-xl:hidden text-base font-light">Cũng là tôi</span>
          </li>
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar

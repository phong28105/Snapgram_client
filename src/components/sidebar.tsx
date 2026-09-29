import { sidebarLists } from "@/data";
import { FaThreads } from "react-icons/fa6";
import { Blocks, Instagram, Menu } from "lucide-react";
import DisplayIcon from "./ui/display-icon";
import CreatePost from "./ui/create-post";
import { MoreMenu } from "./more-menu";

const Sidebar = () => {
  return (
    <aside className="sticky top-0 w-[72px] xl:w-[244px] 2xl:w-[335px] max-md:hidden border-r border-border h-screen pb-5 pt-2 px-3">
      <div className="flex flex-col h-full justify-between">
        <div className="flex flex-col">
          <div className="relative mb-[19px] xl:pb-4 xl:px-3 xl:pt-[25px] max-xl:pb-[23px] max-xl:h-[92px]">
            <a
              href="#"
              className="max-xl:absolute max-xl:top-1/2 max-xl:left-1/2 max-xl:-translate-y-1/2 max-xl:-translate-x-1/2 max-xl:p-3 max-xl:hover:bg-accent max-xl:rounded-lg group"
            >
              <img
                src="/text-logo.png"
                alt="instagram"
                width={110}
                className="max-xl:hidden pointer-events-none"
              />

              <Instagram className="xl:hidden max-xl:group-hover:scale-105 max-xl:transition max-xl:duration-200" />
            </a>
          </div>

          <ul className="flex flex-col max-xl:space-y-4">
            {sidebarLists.map((list, listIndex) => {
              if (list.title === "Create") {
                return (
                  <CreatePost key={listIndex}>
                    <li className="flex items-center xl:my-1 xl:gap-3 xl:p-3 rounded-lg hover:bg-accent cursor-pointer transition max-xl:p-2 max-xl:justify-center group">
                      <DisplayIcon list={list} />

                      <span className="max-xl:hidden text-base font-light">
                        {list.title}
                      </span>
                    </li>
                  </CreatePost>
                );
              }

              return (
                <li
                  key={listIndex}
                  className="flex items-center xl:my-1 xl:gap-3 xl:p-3 rounded-lg hover:bg-accent cursor-pointer transition max-xl:p-2 max-xl:justify-center group"
                >
                  <DisplayIcon list={list} />

                  <span
                    className={`max-xl:hidden text-base ${list.active ? "font-bold" : "font-light"
                      } ${list.title === "Home" ? "-translate-x-[2.8px]" : ""}`}
                  >
                    {list.title}
                  </span>
                </li>
              );
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
  );
};

export default Sidebar;

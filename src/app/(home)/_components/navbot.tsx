import { sidebarLists } from "@/data";
import DisplayIcon from "@/components/ui/display-icon";
import Link from "next/link";

const Navbot = () => {
  return (
    <nav className="block md:hidden sticky bottom-0">
      <div className="py-3.5 flex items-center bg-background border-t border-border">
        <ul className="flex flex-row w-full justify-evenly items-stretch">
          {sidebarLists.map((sidebarList, sidebarListIndex) => {
            if (sidebarList.title === "Tìm kiếm") return null;
            if (sidebarList.title === "Thông báo") return null;

            const iconContent = (
              <li className="cursor-pointer">
                <DisplayIcon list={sidebarList} />
              </li>
            );

            if (sidebarList.href) {
              return (
                <Link key={sidebarListIndex} href={sidebarList.href}>
                  {iconContent}
                </Link>
              );
            }

            return <div key={sidebarListIndex}>{iconContent}</div>;
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Navbot;

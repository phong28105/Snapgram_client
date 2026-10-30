import { TSidebarList } from "@/data";
import { IoMdHome } from "react-icons/io";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import Image from "next/image";

const DisplayIcon = ({
  list,
  notificationCount = 0,
  messageCount = 0,
}: {
  list: TSidebarList;
  /** Số thông báo chưa đọc — hiển thị badge trên icon "Thông báo". */
  notificationCount?: number;
  /** Số tin nhắn chưa đọc — hiển thị badge trên icon "Tin nhắn". */
  messageCount?: number;
}) => (
  <div className="relative">
    {/* BADGE: Tin nhắn (số tin chưa đọc thật từ chat-service) */}
    {list.title === "Tin nhắn" ? <NotificationBadge count={messageCount} /> : null}

    {/* BADGE: Thông báo (số chưa đọc, góc trên-phải icon) */}
    {list.title === "Thông báo" ? (
      <NotificationBadge count={notificationCount} />
    ) : null}

    {list.img ? (
      <img
        src={list.img}
        alt="profile"
        className={`object-cover rounded-full w-6 h-6 xl:w-[22px] xl:h-[22px] transition duration-75 group-hover:scale-105 ${
          list.active ? "ring-2 ring-foreground" : ""
        }`}
      />
    ) : list.title.toLowerCase() === "trang chủ" ? (
      <IoMdHome className="transition duration-75 w-6 h-6 xl:w-[26px] xl:h-[26px] xl:-translate-x-[2px] group-hover:scale-105" />
    ) : (
      list.icon && (
        <list.icon className="transition duration-75 w-6 h-6 xl:w-[22px] xl:h-[22px] group-hover:scale-105" />
      )
    )}
  </div>
);

export default DisplayIcon;

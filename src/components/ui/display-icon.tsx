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

    {list.title.toLowerCase() === "trang chủ" ? (
      <IoMdHome className="transition duration-75 xl:-translate-x-[2.5px] xl:w-[26.5px] xl:h-[26.5px] max-xl:w-[30.5px] max-xl:h-[30.5px] max-xl:group-hover:scale-105" />
    ) : (
      list.icon && (
        <list.icon className="transition duration-75 xl:w-[22px] xl:h-[22px] max-xl:w-[24px] max-xl:h-[24px] max-xl:group-hover:scale-105" />
      )
    )}

    {list.img && (
      <img
        src={list.img}
        alt="profile"
        className={`object-cover rounded-full xl:w-[22px] xl:h-[22px] max-xl:w-[24px] max-xl:h-[24px] max-xl:rounded-full max-xl:group-hover:scale-105 max-xl:transition max-xl:duration-75 ${
          list.active ? "ring-2 ring-foreground" : ""
        }`}
      />
    )}
  </div>
);

export default DisplayIcon;

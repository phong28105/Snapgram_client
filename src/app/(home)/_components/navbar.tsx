"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { NotificationsSheet } from "@/components/notifications/notifications-sheet";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { useNotifications } from "@/hooks/use-notifications";
import SnapgramThumb from "@/components/logo/SnapgramThumb";
import SnapgramLogo from "@/components/logo/SnapgramLogo";

const Navbar = () => {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [isInputActive, setIsInputActive] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/explore?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/explore");
    }
  };

  return (
    <nav className="h-[54px] sm:h-[60px] hidden max-md:flex flex-row items-center px-3 sm:px-4 border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur-md shrink-0 w-full">
      <div className="w-full flex flex-row items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 group shrink-0 select-none"
          aria-label="Snapgram Trang chủ"
        >
          <SnapgramThumb className="w-6 h-6 sm:w-7 sm:h-7 text-foreground transition-transform duration-200 group-hover:scale-105" />
          <SnapgramLogo className="w-[88px] sm:w-[100px] h-auto text-foreground" />
        </Link>

        <div className="flex flex-row items-center gap-x-2 sm:gap-x-3">
          <form onSubmit={handleSubmit} className="hidden sm:block">
            <div className="relative bg-muted rounded-lg">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`h-[34px] bg-transparent border-none outline-none placeholder:text-muted-foreground text-foreground font-light text-xs sm:text-sm w-full pe-4 ${
                  isInputActive ? "w-[200px] ps-3.5" : "ps-9 w-[160px]"
                }`}
                placeholder="Tìm kiếm..."
                onFocus={() => setIsInputActive(true)}
                onBlur={() => setIsInputActive(false)}
              />

              {!isInputActive ? (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="w-3.5 h-3.5" />
                </div>
              ) : null}
            </div>
          </form>

          {/* Icon tìm kiếm nhanh cho màn hình nhỏ */}
          <Link
            href="/explore"
            className="sm:hidden p-1.5 rounded-md hover:bg-accent text-foreground transition"
            aria-label="Tìm kiếm"
          >
            <Search className="w-5 h-5" />
          </Link>

          <NotificationsSheet>
            <button
              type="button"
              aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : "Thông báo"}
              className="relative inline-flex items-center justify-center p-1.5 rounded-md hover:bg-accent transition"
            >
              <Bell className="w-[22px] h-[22px] sm:w-6 sm:h-6" />
              <NotificationBadge count={unreadCount} size="sm" className="sm:hidden" />
              <NotificationBadge count={unreadCount} size="md" className="hidden sm:flex" />
            </button>
          </NotificationsSheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

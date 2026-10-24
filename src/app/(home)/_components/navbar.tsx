"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { NotificationsSheet } from "@/components/notifications/notifications-sheet";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { useNotifications } from "@/hooks/use-notifications";

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
    <nav className="h-[60px] hidden max-md:flex flex-row items-center px-4 border-b border-border">
      <div className="w-full flex flex-row items-center justify-between">
        <Link href="/" className="relative">
          <img
            src="/text-logo.png"
            alt="Text Logo"
            width={110}
            className="pointer-events-none"
          />
        </Link>

        <div className="flex flex-row items-center gap-x-3">
          <form onSubmit={handleSubmit} className="max-[460px]:hidden">
            <div className="relative bg-muted rounded-lg">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`h-[36px] bg-transparent border-none outline-none placeholder:text-muted-foreground text-foreground font-light text-sm w-full pe-4 ${
                  isInputActive ? "w-[237px] ps-4" : "ps-10"
                }`}
                placeholder="Tìm kiếm..."
                onFocus={() => setIsInputActive(true)}
                onBlur={() => setIsInputActive(false)}
              />

              {!isInputActive ? (
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="w-4 h-4" />
                </div>
              ) : null}
            </div>
          </form>

          <NotificationsSheet>
            <button
              type="button"
              aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : "Thông báo"}
              className="relative inline-flex items-center justify-center p-1 rounded-md hover:bg-accent transition"
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

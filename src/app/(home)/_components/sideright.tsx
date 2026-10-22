"use client";

import { profiles, siderightFooterLists } from "@/data";
import { useAuth } from "@/hooks/use-auth";
import { useLoginModal } from "@/components/providers/login-modal-provider";
import Link from "next/link";
import { VerifiedBadge } from "@/components/ui/verified-badge";

const Sideright = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openLoginModal } = useLoginModal();

  return (
    <aside className="max-[1160px]:hidden ps-16 pt-8 w-[319px]">
      <div className="flex flex-col space-y-6">
        {/* current user account or login prompt */}
        {isAuthenticated && user ? (
          <div className="flex flex-row items-center justify-between w-full">
            <Link href="/profile" className="flex flex-row items-center gap-x-3 hover:opacity-80 transition">
              <img
                src={user.avatarUrl || "/profile.jpg"}
                alt={user.username || "profile"}
                width={44}
                height={44}
                className="w-[44px] h-[44px] object-cover rounded-full"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <h6 className="text-xs font-bold tracking-tighter">{user.username}</h6>
                  <VerifiedBadge
                    verified={user.verified}
                    verifiedUntil={user.verifiedUntil}
                    size={13}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">{user.displayName || user.email}</span>
              </div>
            </Link>

            <Link
              href="/login"
              className="font-semibold text-blue-500 text-xs hover:opacity-80 transition duration-75"
            >
              Chuyển
            </Link>
          </div>
        ) : !isLoading ? (
          <div className="flex flex-row items-center justify-between w-full p-3 rounded-xl border border-border bg-card/60">
            <div className="flex flex-col">
              <h6 className="text-xs font-bold">Đăng nhập Snapgram</h6>
              <span className="text-[11px] text-muted-foreground">Để xem thêm bài viết & tương tác</span>
            </div>
            <button
              type="button"
              onClick={openLoginModal}
              className="font-semibold text-xs text-primary hover:underline transition"
            >
              Đăng nhập
            </button>
          </div>
        ) : null}

        {/* Suggested for you */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row justify-between items-center">
            <h5 className="text-sm text-primary font-semibold">
              Gợi ý cho bạn
            </h5>
            <button
              type="button"
              className="text-xs text-primary font-semibold tracking-tight hover:text-muted-foreground duration-75 transition"
            >
              Xem tất cả
            </button>
          </div>

          {profiles.map((_, profileIndex) => {
            if (profileIndex >= 5) return null;

            return (
              <div
                key={profileIndex}
                className="flex flex-row justify-between items-center"
              >
                <div className="flex flex-row items-center gap-x-3">
                  <img
                    src="/profile.jpg"
                    alt="profile"
                    width={44}
                    height={44}
                    className="w-[44px] h-[44px] object-cover rounded-full"
                  />
                  <h6 className="text-xs font-bold tracking-tighter">433</h6>
                </div>

                <button
                  type="button"
                  className="font-semibold text-blue-500 text-xs hover:opacity-80 transition duration-75"
                >
                  Theo dõi
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10">
        <div className="flex flex-col space-y-4">
          <ul className="flex flex-row flex-wrap gap-x-1">
            {siderightFooterLists.map((list, listIndex) => (
              <li
                key={list}
                className="cursor-pointer hover:underline text-muted-foreground text-xs"
              >
                {list === "Meta Verified" ? (
                  <Link href="/verified" className="hover:underline">
                    {list}
                  </Link>
                ) : (
                  list
                )}
                {listIndex !== siderightFooterLists.length - 1 ? "," : ""}
              </li>
            ))}
          </ul>

          <h6 className="text-muted-foreground text-xs uppercase">
            &copy; 2026 Snapgram
          </h6>
        </div>
      </footer>
    </aside>
  );
};

export default Sideright;

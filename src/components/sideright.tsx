import { profiles, siderightFooterLists } from "@/data";

const Sideright = () => {
  return (
    <aside className="max-[1160px]:hidden ps-16 pt-8 w-[319px]">
      <div className="flex flex-col space-y-6">
        {/* switch account */}
        <div className="flex flex-row items-center justify-between w-full">
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
            className="font-semibold text-blue-500  text-xs hover:opacity-80 transition duration-75"
          >
            Chuyển
          </button>
        </div>

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
                {list}
                {listIndex !== siderightFooterLists.length - 1 ? "," : ""}
              </li>
            ))}
          </ul>

          <h6 className="text-muted-foreground text-xs uppercase">
            &copy; Instagram
          </h6>
        </div>
      </footer>
    </aside>
  );
};

export default Sideright;

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">
        Rất tiếc, trang này hiện không khả dụng.
      </h2>
      <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
        Liên kết bạn truy cập có thể bị hỏng hoặc trang đã bị gỡ. Hãy quay lại Snapgram.
      </p>
      <Link href="/">
        <Button variant="default" className="font-semibold">
          Quay lại Trang chủ
        </Button>
      </Link>
    </div>
  );
}

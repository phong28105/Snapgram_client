import AuthImageCarousel from "./auth-image-carousel"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — ảnh minh hoạ, ẩn trên mobile */}
      <div className="hidden md:block md:w-1/2 lg:w-[55%] relative bg-black overflow-hidden">
        <AuthImageCarousel />
      </div>

      {/* Right panel — form */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col items-center justify-center min-h-screen px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-[380px] my-auto">{children}</div>
      </div>
    </div>
  )
}

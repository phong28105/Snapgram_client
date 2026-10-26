import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ui/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LoginModalProvider } from "@/components/providers/login-modal-provider";
import { NotificationsProvider } from "@/components/providers/notifications-provider";
import { ChatProvider } from "@/components/providers/chat-provider";
import { DesktopMiniChat } from "@/components/chat/desktop-mini-chat";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Snapgram",
  description: "A social media platform for sharing photos and videos.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-balance`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ChatProvider>
              <NotificationsProvider>
                <LoginModalProvider>
                  {modal}
                  {children}
                  <DesktopMiniChat />
                  <Toaster />
                </LoginModalProvider>
              </NotificationsProvider>
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

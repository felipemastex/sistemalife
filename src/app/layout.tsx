
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerDataProvider } from "@/hooks/use-player-data";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { PushNotificationPrompt } from "@/components/custom/PushNotificationPrompt";
import { PlayerDataSync } from "@/hooks/use-player-data-sync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SystemLife",
  description: "A sua vida, gamificada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <AuthProvider>
          <PlayerDataProvider>
            <PlayerDataSync />
            {children}
            <Toaster />
            <PushNotificationPrompt />
          </PlayerDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { PlayerDataProvider } from "@/hooks/use-player-data";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { PushNotificationPrompt } from "@/components/custom/PushNotificationPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
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
        className={`${inter.variable} ${robotoMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <AuthProvider>
          <PlayerDataProvider>
            {children}
            <Toaster />
            <PushNotificationPrompt />
          </PlayerDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
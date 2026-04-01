import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { LocaleProvider } from "@/contexts/locale-context";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Little Story",
  description: "Personalized stories, just for your child",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <head><script src="/theme-init.js" /></head>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-nunito)]">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist_Mono, Sora } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GTM Engine",
  description: "Find buyers, approve messages and track your pipeline.",
};

export const viewport: Viewport = {
  // Lets the bottom tabs sit above the phone's home bar.
  viewportFit: "cover",
  themeColor: "#07131A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${sora.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" theme="dark" />
      </body>
    </html>
  );
}

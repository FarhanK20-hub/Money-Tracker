import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";
import { ThemeProvider } from "@/components/ThemeProvider";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Money Tracker",
  description: "Personal & Business expense tracking — independent financial systems",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Money Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrains.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <AuthProvider>
            <DataProvider>
              {children}
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

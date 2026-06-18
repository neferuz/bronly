import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import TelegramInit from "@/components/TelegramInit";

const evolventa = localFont({
  src: [
    {
      path: "../../public/fonts/Evolventa-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Evolventa-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-evolventa",
});

export const metadata: Metadata = {
  title: "Bronly Client | Онлайн-запись",
  description: "Удобная онлайн-запись в салоны красоты и барбершопы через систему Bronly. Выбирайте мастера, время и записывайтесь за несколько секунд.",
  icons: {
    icon: "/b-orange.svg",
    apple: "/b-orange.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${evolventa.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans" suppressHydrationWarning>
        {children}
        <TelegramInit />
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}

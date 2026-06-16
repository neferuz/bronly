import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bronly | Система автоматизации и онлайн-записи для сферы услуг",
  description: "Bronly помогает барбершопам, салонам красоты и частным мастерам привлекать клиентов и автоматизировать бизнес-процессы. Онлайн-запись, удобная CRM-система и личные кабинеты для всей команды.",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { MasterProvider } from "@/context/MasterContext";

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
  title: "Bronly Master | Кабинет мастера",
  description: "Личный кабинет мастера в системе Bronly. Просмотр расписания, управление статусом работы, подтверждение записей и финансовая статистика в реальном времени.",
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
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans">
        <MasterProvider>
          {children}
        </MasterProvider>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </body>
    </html>
  );
}

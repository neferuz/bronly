import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SuperAdminProvider } from "../hooks/useSuperAdmin";
import { ToastProvider } from "../components/ui/Toast";
import SuperAdminLayoutWrapper from "../components/layout/SuperAdminLayoutWrapper";

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
  title: "Bronly Super Admin | Панель управления платформой",
  description: "Глобальная панель администрирования Bronly. Управление подписками, компаниями, филиалами и тарифами.",
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
    <html lang="ru" className={`${evolventa.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 flex font-sans">
        <ToastProvider>
          <SuperAdminProvider>
            <SuperAdminLayoutWrapper>
              {children}
            </SuperAdminLayoutWrapper>
          </SuperAdminProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

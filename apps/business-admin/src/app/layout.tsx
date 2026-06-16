import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BusinessProvider } from "../hooks/useBusiness";

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
  title: "Bronly CRM | Панель управления бизнесом",
  description: "Профессиональная CRM-система Bronly для автоматизации барбершопов, салонов красоты и мастеров. Управление расписанием, клиентами, услугами и аналитикой.",
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
        <BusinessProvider>
          {children}
        </BusinessProvider>
      </body>
    </html>
  );
}

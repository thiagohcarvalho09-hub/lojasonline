import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ATELIER — moda & acessórios", template: "%s · ATELIER" },
  description: "Alfaiataria, couro e metal líquido. Loja online e painel de gestão em um só lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital@0;1&family=Lato:wght@300;400;700;900&display=swap" />
      </head>
      <body>
        <div className="ambient grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}

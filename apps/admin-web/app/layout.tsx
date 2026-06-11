import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vavive GPTMaker Platform",
  description: "Camada SaaS Vavive para franquias usando GPTMaker"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

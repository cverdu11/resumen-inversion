import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resumen de Inversión",
  description: "Visión general de rendimiento y evolución",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-ES" className="dark">
      <body>{children}</body>
    </html>
  );
}

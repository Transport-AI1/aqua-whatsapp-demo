import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AQUA Apartments Bellamar | WhatsApp Demo",
  description: "Demostración interactiva de atención al huésped para AQUA Apartments Bellamar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CiviXLab — Civil Engineering Lab Testing SaaS",
  description:
    "Multi-tenant laboratory testing platform for Saudi Arabia & GCC. SASO, SBC, ASTM compliant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";

import { Header } from "@/components/Header";

import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-archivo",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Limdaqui Trading Inc. — Medical Supplies & Equipment",
  description:
    "Your reliable source for quality pharmaceuticals, medical equipment, and healthcare supplies in the Philippines. Shop online and get delivered nationwide.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${manrope.variable}`}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}

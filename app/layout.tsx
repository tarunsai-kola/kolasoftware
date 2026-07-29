import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});
export const metadata: Metadata = {
  title: "Custom Software Development Company in Bangalore | Kola Solutions",
  description: "Kola Solutions is a premium software company in Bangalore specializing in custom CRM development, WhatsApp automation, and custom ecommerce website development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${outfit.className} antialiased bg-[#fcfcfc]`}>
        {children}
      </body>
    </html>
  );
}

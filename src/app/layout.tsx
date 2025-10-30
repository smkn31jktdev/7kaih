import type { Metadata } from "next";
import { Poppins, Unbounded } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "7 Kebiasaan Anak Indonesia Hebat - SMKN 31 Jakarta",
  description: "Web 7 Kebiasaan Anak Indonesia Hebat - SMKN 31 Jakarta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${unbounded.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

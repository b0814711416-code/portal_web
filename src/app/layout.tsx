import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "ไชยสอ DocHub — โรงเรียนบ้านไชยสอ สพป.ขอนแก่น เขต 5",
  description: "ระบบบริหารจัดการและจัดเก็บเอกสารราชการภายในโรงเรียนบ้านไชยสอ สำนักงานเขตพื้นที่การศึกษาประถมศึกษาขอนแก่น เขต 5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sarabun)] bg-gray-50">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commerce Scale Planner",
  description: "A 12-month e-commerce scaling planner for branded imported products.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lipsa Vendor Dashboard",
  description: "Vendor management dashboard for Lipsa marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

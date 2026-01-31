import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FTA Action Sports",
  description: "Forget the Algorithm. Raw action sports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

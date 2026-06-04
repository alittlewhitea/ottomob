import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OttoMob - Social Media Marketing Marketplace",
  description:
    "A social media growth service marketplace for followers, likes, views, comments, and engagement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

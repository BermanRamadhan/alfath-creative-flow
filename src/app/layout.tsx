import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Al-Fath Flow",
  description: "Internal workflow app for request, content creation, review, bank content, and performance feedback."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

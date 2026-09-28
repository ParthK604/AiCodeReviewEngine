import type { Metadata } from "next";
import type { ReactNode } from "react";

import AuthWrapper from "../components/AuthWrapper";
import Navbar from "../components/Navbar";
import ToastProvider from "../components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeReview AI",
  description: "AI-assisted code reviews for your projects.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-gray-100">
        <AuthWrapper>
          <Navbar />
          <ToastProvider />
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}

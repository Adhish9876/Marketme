"use client";

import type { Metadata } from 'next';
import './globals.css';
import Navbar from "../components/Navbar";
import { ChatWidget } from "@/components/ChatWidget";
//import { ThemeProvider } from "@/components/theme-provider"


// Note: Metadata cannot be used with "use client" - move metadata to a separate server component if needed
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#121212] text-white antialiased">
        <div className="relative min-h-screen bg-[#121212]">
          {children}
        </div>
        <ChatWidget />
      </body>
    </html>
  )
}
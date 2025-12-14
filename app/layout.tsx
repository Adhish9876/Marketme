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
    <html lang="en">
      <body className="bg-[#EBEAE5] transition-colors">
       
        <div className="min-h-screen bg-[#EBEAE5]">
          {children}
        </div>
        <ChatWidget />
      
      </body>
    </html>
  )
}
import type { Metadata } from 'next';
import './globals.css';
import Navbar from "../components/Navbar";
//import { ThemeProvider } from "@/components/theme-provider"


export const metadata: Metadata = {
  title: 'Project',
  description: 'Next.js project',
};

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
      
      </body>
    </html>
  )
}
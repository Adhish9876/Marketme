import type { Metadata } from 'next';
import './globals.css';
import Navbar from "../components/Navbar";


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
      <body>
  <Navbar />
  <div className="min-h-screen bg-gray-100">
    {children}
  </div>
</body>

    </html>
  )
}
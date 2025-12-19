import { Inter } from "next/font/google"
import "./globals.css"
import DashboardLayout from "@/components/layout/DashboardLayout"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata = {
  title: "PS Rental | Premium Admin Panel",
  description: "Advanced PlayStation Rental Management System",
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  )
}

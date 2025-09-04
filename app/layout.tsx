import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AI Logistics Agent",
  description: "CSV → MongoDB → Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
         <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "toast-base", 
              success: "toast-success",
              error: "toast-error",
              warning: "toast-warning",
            },
          }}
        />
      </body>
    </html>
  );
}

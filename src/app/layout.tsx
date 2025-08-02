import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scrumptious - Project Management & Daily Stand-ups",
  description: "Manage your projects, goals, tasks, and daily stand-ups efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.message && 
                    event.reason.message.includes('message channel closed')) {
                  event.preventDefault();
                  console.log('Suppressed browser extension error:', event.reason.message);
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}

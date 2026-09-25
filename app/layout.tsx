import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConsoleSignature } from "@/components/ConsoleSignature";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "TelePrompt Pro | All-In-One Professional Teleprompter & Loud Audio Coach",
  description:
    "The modern all-in-one studio teleprompter featuring Best Loud Audio Mode, natural speech synthesis narration, WCAG AAA high-contrast accessibility, Bionic reading guides, and 100% private local script management.",
  applicationName: "TelePrompt Pro",
  authors: [{ name: "Karthikeyan T (@carthworks)", url: "https://github.com/carthworks" }],
  generator: "Next.js",
  keywords: [
    "teleprompter",
    "speech prompter",
    "loud audio coach",
    "speech synthesis prompter",
    "public speaking",
    "video recording",
    "podcast teleprompter",
    "presentation prompter",
    "accessible teleprompter",
    "WCAG AAA teleprompter",
    "carthworks"
  ],
  creator: "Karthikeyan T (@carthworks)",
  publisher: "carthworks",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://teleprompt.vercel.app",
    siteName: "TelePrompt Pro",
    title: "TelePrompt Pro | All-In-One Professional Teleprompter & Loud Audio Coach",
    description:
      "Modern all-in-one studio teleprompter featuring Best Loud Audio Mode, natural voice coaching, and distraction-free speech delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TelePrompt Pro | Studio Teleprompter & Loud Audio Coach",
    description:
      "Modern all-in-one studio teleprompter with Best Loud Audio Mode, speech synthesis, and local privacy.",
    creator: "@carthworks",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen`}
      >
        <ConsoleSignature />
        {children}
      </body>
    </html>
  );
}

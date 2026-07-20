import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { RegisterSW } from "@/components/offline/register-sw";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIRIUS CRM — Courtage en assurance",
  description:
    "Prototype CRM pour cabinet de courtage en assurance. Dakar, Sénégal.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SIRIUS CRM", statusBarStyle: "black" },
  icons: {
    icon: [
      { url: "/sirius-mark-192.png", sizes: "192x192", type: "image/png" },
      { url: "/sirius-mark-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/sirius-mark-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F131F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <RegisterSW />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientToaster } from "@/components/client-toaster";
import { AuthProvider } from "@/context/AuthContext";
import { OrganizationProvider } from "@/context/OrganizationContext";
import "./globals.css";
import "./tokens.css";

export const metadata: Metadata = {
  title: "Faddy",
  description: "A comprehensive customer feedback management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("vite-ui-theme")||localStorage.getItem("theme");var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var c=document.documentElement.classList;c.remove("light","dark");c.add(d?"dark":"light")}catch(e){}`,
          }}
        />
        {/* Font preloads — reduce FOUT for Inter and Source Code Pro */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Inter: weights 300–700 + italic 400 for prose emphasis */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Source Code Pro: regular weight only (code blocks, API keys) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {process.env.NODE_ENV === "production" && (
          <>
            {/* Google Analytics 4 — loads after the page becomes interactive */}
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-E3TEHBRZ6W"
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-E3TEHBRZ6W');
              `}
            </Script>
          </>
        )}
        <AuthProvider>
          <OrganizationProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <ClientToaster />
            </ThemeProvider>
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

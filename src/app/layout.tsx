import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from 'next/link';
import SidebarLayout from './SidebarLayout';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ExpenseProvider } from "@/context/ExpenseContext";
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
  title: "LexTax",
  description: "App gestionale per avvocati in regime forfettario e ordinario",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LexTax"
  }
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#007aff",
          colorBackground: "rgba(255, 255, 255, 0.95)",
          colorText: "#000000",
          colorInputBackground: "#f2f2f7",
          colorInputText: "#000000",
          colorShimmer: "#e5e5ea",
          fontFamily: "var(--font-geist-sans)",
          borderRadius: "16px",
        },
        elements: {
          cardBox: "shadow-none border border-[rgba(60,60,67,0.18)] backdrop-blur-xl",
          card: "bg-transparent",
          headerTitle: "font-bold text-2xl tracking-tight",
          headerSubtitle: "text-[#3c3c43] text-sm",
          socialButtonsBlockButton: "border border-[rgba(60,60,67,0.18)] rounded-xl py-3 justify-center text-base font-medium",
          socialButtonsBlockButtonText: "font-semibold font-base",
          formButtonPrimary: "bg-[#007aff] hover:opacity-80 transition-opacity rounded-xl py-4",
          footerActionLink: "text-[#007aff] hover:text-[#007aff] font-semibold",
        }
      }}
      localization={{
        socialButtonsBlockButton: "Accedi con {{provider|titleize}}",
        signIn: {
          start: {
            title: "Accedi a Gestionale",
            subtitle: "La tua area finanziaria sicura.",
            actionText: "Scopri il tuo Netto Reale"
          }
        }
      }}
    >
      <html lang="it">
        <body className={`${geistSans.variable} ${geistMono.variable} bg-[#f2f2f7] dark:bg-black`}>
          <SignedOut>
            <main>
              {children}
            </main>
          </SignedOut>

          <SignedIn>
            <ExpenseProvider>
              <div className="app-container">

                {/* Header Globale (Logo solo su mobile, Desktop lo ha in sidebar) */}
                <header className="ios-header md:hidden">
                  <div className="header-title">LexTax</div>
                  <div className="auth-container">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </header>

                <SidebarLayout>
                  {children}
                </SidebarLayout>

              </div>
            </ExpenseProvider>
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}

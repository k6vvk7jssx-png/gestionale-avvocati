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
  title: "StateraLex",
  description: "App gestionale per avvocati in regime forfettario e ordinario",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StateraLex"
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
          colorBackground: "var(--glass-bg)",
          colorText: "var(--foreground)",
          colorInputBackground: "var(--background)",
          colorInputText: "var(--foreground)",
          colorShimmer: "var(--border)",
          fontFamily: "var(--font-geist-sans)",
          borderRadius: "16px",
        },
        elements: {
          cardBox: "shadow-2xl border border-[var(--border)] backdrop-blur-xl bg-[var(--glass-bg)] w-full max-w-[420px] mx-auto",
          card: "bg-transparent shadow-none",
          headerTitle: "font-bold text-2xl tracking-tight text-[var(--foreground)]",
          headerSubtitle: "text-slate-500 dark:text-slate-400 text-sm",
          socialButtonsBlockButton: "border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--background)] rounded-xl py-3 justify-center text-base font-medium text-[var(--foreground)] transition-all",
          socialButtonsBlockButtonText: "font-semibold text-base text-[var(--foreground)]",
          formButtonPrimary: "bg-[#007aff] hover:opacity-90 transition-opacity rounded-xl py-4 text-white font-bold",
          footerActionLink: "text-[#007aff] hover:text-[#005bb5] font-semibold",
          formFieldLabel: "text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider",
          formFieldInput: "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl py-3 px-4 focus:border-[#007aff] focus:ring-1 focus:ring-[#007aff]",
          dividerLine: "bg-[var(--border)]",
          dividerText: "text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider bg-[var(--glass-bg)] px-2",
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
                  <div className="header-title">StateraLex</div>
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

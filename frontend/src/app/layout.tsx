import type { Metadata } from "next";
import "./globals.css";
import { MuninnProvider } from "@/context/MuninnContext";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "MUNINN — AI Due Diligence Copilot",
  description:
    "Evidence-grounded document analysis for financial filings and corporate disclosures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-muninn-black font-sans antialiased">
        <MuninnProvider>
          <AppShell>{children}</AppShell>
        </MuninnProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Smart Garbage Sorting Assistant",
  description:
    "Classify household waste items instantly and keep track of how you sort.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="header-bar">
            <div className="header-title">
              SMART GARBAGE SORTING ASSISTANT
            </div>
            <nav className="nav-links">
              <Link href="/" className="nav-link nav-link-active">
                Classify waste
              </Link>
              <Link href="/admin" className="nav-link">
                Admin
              </Link>
            </nav>
          </header>
          <main className="app-main">
            <div className="app-container">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}


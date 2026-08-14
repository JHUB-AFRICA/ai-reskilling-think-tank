import type { Metadata } from "next";
import { Source_Serif_4, Inter, IBM_Plex_Mono } from "next/font/google";
import { AppStateProvider } from "@/lib/state";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-display-family",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-body-family", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-family",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Reskilling Think Tank Platform",
  description: "Grounded skills-gap analysis and reskilling pathway recommendations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <AppStateProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="app-main">{children}</main>
          </div>
        </AppStateProvider>
      </body>
    </html>
  );
}

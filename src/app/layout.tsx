import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Release Communication & Readiness Brief Assistant',
  description:
    'Full-stack AI assistant for deterministic release package review, evidence verification, risk detection, and stakeholder briefs with human-in-the-loop approval.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50/60 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />
        <main className="flex-1 pb-16">{children}</main>
        <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Release Communication & Readiness Brief Assistant &bull; Aggroso Assessment MVP</span>
            <span className="font-mono text-[11px] text-slate-400">
              Deterministic Logic &bull; LLM Reasoning &bull; Evidence Citations &bull; Human Control
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}

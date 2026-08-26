import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { MuiThemeProvider } from '@/components/providers/MuiThemeProvider';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Q-Clinix | Smart AI-Ready Queue Management System',
  description: 'A modern, real-time, AI-ready check-in and queue optimization SaaS for medical clinics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans antialiased text-foreground bg-background">
        <AuthProvider>
          <AppProvider>
            <MuiThemeProvider>
              {children}
            </MuiThemeProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/features/auth/context/AuthContext';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
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
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans antialiased text-foreground bg-background">
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

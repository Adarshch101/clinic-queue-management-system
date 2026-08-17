'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Menu, X, Sun, Moon, LogIn } from 'lucide-react';
import Link from 'next/link';

export interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/clinics', label: 'Clinics' },
    { href: '/queue-status', label: 'Live Queue' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-base text-text-primary">
      {/* Premium Public Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle/55 bg-bg-surface/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl px-2.5 py-1 rounded-xl bg-primary text-white font-black leading-none shadow-md shadow-primary/20">
              Q
            </span>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              Q-Clinix
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-text-secondary">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary transition">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-text-secondary hover:bg-bg-muted hover:text-text-primary transition shrink-0"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-400" />}
            </button>

            {/* Login Links */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary-glow border border-primary/25 hover:bg-primary-hover hover:text-white transition"
            >
              <LogIn className="w-3.5 h-3.5" /> Portal Login
            </Link>

            {/* Register Workspace */}
            <Link
              href="/register"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition"
            >
              Register Clinic
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-text-secondary hover:bg-bg-muted md:hidden shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border-subtle bg-bg-surface px-4 pt-2 pb-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-muted hover:text-primary transition"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border-subtle/50 my-2 pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl text-sm font-bold text-primary bg-primary-glow border border-primary/20"
              >
                Portal Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover"
              >
                Register Clinic
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 w-full">{children}</main>

      {/* Premium Public Footer */}
      <footer className="border-t border-border-subtle/55 bg-bg-surface py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-text-secondary">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl px-2 py-0.5 rounded-lg bg-primary text-white font-black leading-none">
                Q
              </span>
              <span className="font-extrabold text-base text-text-primary">Q-Clinix SaaS</span>
            </div>
            <p className="max-w-xs text-text-muted mt-1 leading-relaxed">
              Eliminate waiting room friction, streamline doctor scheduling, and optimize healthcare delivery with AI queue models.
            </p>
          </div>

          <div className="flex flex-wrap gap-8">
            <div className="flex flex-col gap-2">
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-text-primary">Solutions</span>
              <Link href="/clinics" className="hover:text-primary">Clinic Directory</Link>
              <Link href="/queue-status" className="hover:text-primary">Lobby Tracker</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-text-primary">Company</span>
              <Link href="/about" className="hover:text-primary">About Us</Link>
              <Link href="/contact" className="hover:text-primary">Contact Support</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-text-primary">Legal</span>
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Service</a>
              <a href="#" className="hover:text-primary">HIPAA Audit</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border-subtle/40 mt-8 pt-6 flex justify-between items-center text-[10px] text-text-muted">
          <span>© 2026 Q-Clinix Inc. All rights reserved.</span>
          <div className="flex gap-3">
            <a href="#" className="hover:text-primary">Twitter</a>
            <a href="#" className="hover:text-primary">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default PublicLayout;

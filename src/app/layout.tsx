import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#8B5CF6',
};

export const metadata: Metadata = {
    title: 'Dashboard Dépenses | Budget Familial',
    description: 'Tableau de bord glassmorphism pour le suivi du budget familial connecté à Google Sheets',
    keywords: ['dashboard', 'budget', 'finances', 'google sheets', 'dépenses'],
    authors: [{ name: 'Dashboard App' }],
    icons: {
        icon: '/favicon.svg',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" className={inter.variable}>
            <body className={inter.className}>
                <div className="min-h-screen flex flex-col">
                    {children}
                </div>
            </body>
        </html>
    );
}

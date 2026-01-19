'use client';

import { useState } from 'react';
import {
    Menu,
    X,
    BarChart3,
    Filter,
    Table,
    Home,
    Settings,
    Clock,
    ShoppingBag
} from 'lucide-react';

export type NavSection = 'home' | 'history' | 'charts' | 'table' | 'filters' | 'settings' | 't-wake';

interface SidebarProps {
    activeSection: NavSection;
    onSectionChange: (section: NavSection) => void;
}

const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Accueil', icon: <Home className="w-5 h-5" /> },
    { id: 'history', label: 'Historique', icon: <Clock className="w-5 h-5" /> },
    { id: 'charts', label: 'Graphiques', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'table', label: 'Tableau', icon: <Table className="w-5 h-5" /> },
    { id: 't-wake', label: 'T-WAKE', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'filters', label: 'Filtres', icon: <Filter className="w-5 h-5" /> },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 md:hidden p-2 glass rounded-lg"
                aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed left-0 top-0 h-full z-40 w-64 glass
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                md:w-20 md:hover:w-64 group
            `}>
                <div className="p-4 flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8 mt-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">💰</span>
                        </div>
                        <span className="font-bold text-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                            Dashboard
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onSectionChange(item.id);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-3 p-3 rounded-lg transition-all
                                    ${activeSection === item.id
                                        ? 'bg-purple-500/30 text-white'
                                        : 'hover:bg-white/10 text-white/70 hover:text-white'
                                    }
                                `}
                                aria-current={activeSection === item.id ? 'page' : undefined}
                            >
                                <span className="flex-shrink-0">{item.icon}</span>
                                <span className="md:opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </nav>

                    {/* Settings at bottom */}
                    <button
                        onClick={() => {
                            onSectionChange('settings');
                            setIsOpen(false);
                        }}
                        className={`
                            flex items-center gap-3 p-3 rounded-lg transition-all mt-auto
                            ${activeSection === 'settings'
                                ? 'bg-purple-500/30 text-white'
                                : 'hover:bg-white/10 text-white/70 hover:text-white'
                            }
                        `}
                        aria-current={activeSection === 'settings' ? 'page' : undefined}
                    >
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        <span className="md:opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Paramètres
                        </span>
                    </button>

                    {/* Version Indicator */}
                    <div className="mt-2 px-3 text-xs text-white/20 text-center md:opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        v1.2.1-sticky-off
                    </div>
                </div>
            </aside>
        </>
    );
}


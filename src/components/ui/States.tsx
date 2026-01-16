'use client';

import { GlassButton, GlassCard } from './GlassComponents';
import { AlertCircle, FileQuestion, Settings, RefreshCw, WifiOff } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: 'empty' | 'search' | 'error';
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ title, description, icon = 'empty', action }: EmptyStateProps) {
    const icons = {
        empty: <FileQuestion className="w-16 h-16 text-white/30" />,
        search: <FileQuestion className="w-16 h-16 text-white/30" />,
        error: <AlertCircle className="w-16 h-16 text-red-400/50" />,
    };

    return (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6">{icons[icon]}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-white/60 mb-6 max-w-md">{description}</p>
            {action && (
                <GlassButton variant="primary" onClick={action.onClick}>
                    {action.label}
                </GlassButton>
            )}
        </GlassCard>
    );
}

interface ErrorStateProps {
    error: string;
    onRetry?: () => void;
    showConfigHelp?: boolean;
}

export function ErrorState({ error, onRetry, showConfigHelp = false }: ErrorStateProps) {
    return (
        <GlassCard className="border-red-500/30">
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-red-500/20">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-300 mb-2">
                        Erreur de chargement
                    </h3>
                    <p className="text-white/70 mb-4">{error}</p>

                    {showConfigHelp && (
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Comment corriger
                            </h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-white/70">
                                <li>Vérifiez que les variables d&apos;environnement sont correctement configurées</li>
                                <li>Pour Google Sheets API : <code className="bg-white/10 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>, <code className="bg-white/10 px-1 rounded">GOOGLE_PRIVATE_KEY</code>, <code className="bg-white/10 px-1 rounded">GOOGLE_SHEET_ID</code></li>
                                <li>Pour le mode CSV : <code className="bg-white/10 px-1 rounded">SHEET_CSV_URL</code></li>
                                <li>Redémarrez le serveur après modification du fichier <code className="bg-white/10 px-1 rounded">.env.local</code></li>
                            </ol>
                        </div>
                    )}

                    {onRetry && (
                        <GlassButton onClick={onRetry} variant="primary" size="sm">
                            <RefreshCw className="w-4 h-4" />
                            Réessayer
                        </GlassButton>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}

interface ConnectionErrorProps {
    onRetry?: () => void;
}

export function ConnectionError({ onRetry }: ConnectionErrorProps) {
    return (
        <GlassCard className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-amber-500/20 mb-6">
                <WifiOff className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connexion impossible</h3>
            <p className="text-white/60 mb-6 max-w-md">
                Impossible de se connecter à la source de données. Vérifiez votre connexion internet et réessayez.
            </p>
            {onRetry && (
                <GlassButton variant="primary" onClick={onRetry}>
                    <RefreshCw className="w-4 h-4" />
                    Réessayer
                </GlassButton>
            )}
        </GlassCard>
    );
}

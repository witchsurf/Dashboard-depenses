'use client';

import { GlassCard, GlassButton } from '../ui/GlassComponents';
import { Cloud, FileSpreadsheet, Database, ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ConfigWizardProps {
    onClose?: () => void;
}

export function ConfigWizard({ onClose }: ConfigWizardProps) {
    const [copiedItem, setCopiedItem] = useState<string | null>(null);

    const copyToClipboard = async (text: string, item: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedItem(item);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    const CodeBlock = ({ code, label }: { code: string; label: string }) => (
        <div className="relative">
            <pre className="bg-black/30 rounded-lg p-3 text-sm overflow-x-auto font-mono text-emerald-300">
                {code}
            </pre>
            <button
                onClick={() => copyToClipboard(code, label)}
                className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={`Copier ${label}`}
            >
                {copiedItem === label ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                    <Copy className="w-4 h-4" />
                )}
            </button>
        </div>
    );

    return (
        <GlassCard className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <Database className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Configuration requise</h2>
                <p className="text-white/60">
                    Connectez une source de données pour afficher vos données réelles.
                    <br />
                    En attendant, vous visualisez des données de démonstration.
                </p>
            </div>

            <div className="space-y-6">
                {/* Option A: Google Sheets API */}
                <div className="border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Cloud className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Option A: Google Sheets API</h3>
                            <p className="text-sm text-white/60">Recommandé - Accès temps réel</p>
                        </div>
                    </div>

                    <ol className="space-y-3 text-sm">
                        <li className="flex gap-2">
                            <span className="font-bold text-purple-400">1.</span>
                            <span>Créez un compte de service Google Cloud et téléchargez la clé JSON</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-purple-400">2.</span>
                            <span>Partagez votre Google Sheet avec l&apos;email du compte de service</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-purple-400">3.</span>
                            <span>Créez un fichier <code className="bg-white/10 px-1 rounded">.env.local</code> avec :</span>
                        </li>
                    </ol>

                    <div className="mt-3">
                        <CodeBlock
                            label="env-api"
                            code={`GOOGLE_SERVICE_ACCOUNT_EMAIL=votre-compte@projet.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=1E8SpDzu3LKLftljriIMjH9OuCb5lHA4xxfmQYe04tz0`}
                        />
                    </div>
                </div>

                {/* Option B: CSV */}
                <div className="border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Option B: URL CSV</h3>
                            <p className="text-sm text-white/60">Simple - Publiez votre sheet en CSV</p>
                        </div>
                    </div>

                    <ol className="space-y-3 text-sm">
                        <li className="flex gap-2">
                            <span className="font-bold text-cyan-400">1.</span>
                            <span>Dans Google Sheets : Fichier → Partager → Publier sur le web → CSV</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-cyan-400">2.</span>
                            <span>Copiez l&apos;URL générée</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-cyan-400">3.</span>
                            <span>Ajoutez dans <code className="bg-white/10 px-1 rounded">.env.local</code> :</span>
                        </li>
                    </ol>

                    <div className="mt-3">
                        <CodeBlock
                            label="env-csv"
                            code={`SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/1E8SpDzu3LKLftljriIMjH9OuCb5lHA4xxfmQYe04tz0/export?format=csv`}
                        />
                    </div>
                </div>

                {/* Next steps */}
                <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-white/70">
                        <strong>Étape suivante :</strong> Après avoir configuré les variables d&apos;environnement,
                        redémarrez le serveur Next.js avec <code className="bg-white/10 px-1 rounded">npm run dev</code>
                    </p>
                </div>

                {onClose && (
                    <div className="flex justify-end">
                        <GlassButton onClick={onClose} variant="primary">
                            Continuer avec les données de démo
                            <ArrowRight className="w-4 h-4" />
                        </GlassButton>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}

# Dashboard Dépenses 💰

Un tableau de bord glassmorphism moderne et responsive pour le suivi du budget familial, connecté à Google Sheets.

![Dashboard Preview](./docs/preview.png)

## ✨ Fonctionnalités

- **Design Glassmorphism** : Interface moderne avec effets de verre, animations fluides et thème sombre
- **Connexion Google Sheets** : Synchronisation temps réel via API v4 ou fallback CSV
- **Détection automatique** : Inférence des types de colonnes (dates, nombres, catégories)
- **Visualisations** : Graphiques Recharts (time-series, bar chart, donut)
- **Tableau de données** : Tri, pagination, recherche et export CSV
- **Filtres avancés** : Date range, multi-select catégories, recherche globale
- **Mode démo** : Prévisualisation avec données mock si aucune source configurée
- **Responsive** : Mobile-first, navigation compacte, panneaux repliables

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- npm ou yarn

### Installation

```bash
# Cloner le projet
cd "Dashboard depenses"

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📊 Configuration des données

### Option A : Google Sheets API (Recommandé)

Accès temps réel à vos données avec mise à jour automatique.

1. **Créer un compte de service Google Cloud**
   - Aller sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créer un nouveau projet ou en sélectionner un existant
   - Activer l'API Google Sheets
   - Créer un compte de service (IAM → Comptes de service)
   - Télécharger la clé JSON

2. **Partager votre Google Sheet**
   - Ouvrir votre Google Sheet
   - Cliquer sur "Partager"
   - Ajouter l'email du compte de service (depuis le JSON)
   - Donner le rôle "Lecteur"

3. **Configurer les variables d'environnement**
   ```bash
   # .env.local
   GOOGLE_SERVICE_ACCOUNT_EMAIL=votre-compte@projet.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   GOOGLE_SHEET_ID=1E8SpDzu3LKLftljriIMjH9OuCb5lHA4xxfmQYe04tz0
   ```

### Option B : Mode CSV (Simple)

Solution plus simple sans configuration API.

1. **Publier votre Google Sheet en CSV**
   - Fichier → Partager → Publier sur le Web
   - Sélectionner "Valeurs séparées par des virgules (.csv)"
   - Cliquer sur "Publier"
   - Copier l'URL générée

2. **Configurer la variable d'environnement**
   ```bash
   # .env.local
   SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/VOTRE_ID/export?format=csv
   ```

### Mode Démo

Si aucune variable n'est configurée, l'application affiche des données de démonstration pour prévisualiser l'interface.

## 🏗️ Architecture

```
src/
├── app/
│   ├── layout.tsx          # Layout principal avec fonts et metadata
│   ├── page.tsx            # Page dashboard principale
│   ├── globals.css         # Styles glassmorphism et design system
│   └── api/sheets/
│       └── route.ts        # API route pour les données
├── components/
│   ├── ui/                 # Composants UI réutilisables
│   │   ├── GlassComponents.tsx
│   │   ├── Skeleton.tsx
│   │   └── States.tsx
│   ├── layout/
│   │   └── Topbar.tsx      # Barre de navigation
│   └── dashboard/
│       ├── KPICards.tsx    # Cartes indicateurs
│       ├── TimeSeriesChart.tsx
│       ├── CategoryBarChart.tsx
│       ├── DonutChart.tsx
│       ├── DataTable.tsx
│       ├── Filters.tsx
│       └── ConfigWizard.tsx
├── lib/
│   ├── sheets.ts           # Google Sheets API client
│   ├── csv.ts              # CSV fetcher
│   ├── schema.ts           # Inférence de schéma
│   ├── mock-data.ts        # Données de démo
│   ├── data-fetcher.ts     # Unified data fetcher
│   └── utils.ts            # Utilitaires
└── types/
    └── index.ts            # Types TypeScript
```

## 🎨 Design System

Le design utilise un effet glassmorphism avec :

- **Fond** : Gradient violet/bleu avec orbes animés
- **Cartes** : Fond semi-transparent avec blur et bordure subtile
- **Couleurs accent** : 
  - Violet (#8B5CF6) - Principal
  - Cyan (#06B6D4) - Secondaire
  - Émeraude (#10B981) - Succès
  - Rouge (#EF4444) - Danger

## 🧪 Scripts

```bash
npm run dev       # Serveur de développement
npm run build     # Build production
npm run start     # Serveur production
npm run lint      # Vérification ESLint
npm run type-check # Vérification TypeScript
```

## 🚢 Déploiement

### Vercel (Recommandé)

1. Connecter votre repo GitHub à Vercel
2. Ajouter les variables d'environnement dans les paramètres du projet
3. Déployer

```bash
# Ou via CLI
npx vercel
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## 📱 Responsive Design

- **Mobile (< 768px)** : Navigation compacte, cartes en grille 2 colonnes, panneaux repliables
- **Tablette (768px - 1024px)** : Grille adaptative, sidebar collapsible
- **Desktop (> 1024px)** : Layout complet avec sidebar et grille 6 colonnes

## ♿ Accessibilité

- Contraste WCAG 2.1 AA
- Navigation au clavier
- Labels ARIA sur tous les éléments interactifs
- Support du mode contraste élevé
- Respect de `prefers-reduced-motion`

## 📄 License

MIT

---

Créé avec ❤️ using Next.js, TypeScript, Tailwind CSS et Recharts

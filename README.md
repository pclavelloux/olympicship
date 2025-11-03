
## Todo:
- CRON pour refresh les data chaque jour


# TrustCode - GitHub Contributions Leaderboard

<div align="center">

**Comparez vos contributions GitHub avec d'autres développeurs**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com/)

[Demo](#) • [Documentation](#-documentation) • [Installation rapide](#-installation-rapide)

</div>

---

## 📸 Aperçu

TrustCode est une application web de classement (leaderboard) des contributions GitHub. Elle permet aux développeurs de :
- 🔐 Se connecter via GitHub OAuth (lecture seule)
- 📊 Afficher leurs contributions sous forme de grille interactive
- 🏆 Se comparer avec d'autres développeurs
- 👤 Personnaliser leur profil avec un nom d'affichage et un lien vers leur site

## ✨ Fonctionnalités

### Authentification
- 🔐 **GitHub OAuth** - Connexion sécurisée en lecture seule
- 🍪 **Session persistante** - Restez connecté

### Visualisation
- 📊 **Grille de contributions** - Style GitHub avec heatmap
- 📈 **Statistiques globales** - Total users, contributions, moyennes
- 🏆 **Classement automatique** - Triés par nombre de contributions

### Profils
- 👤 **Personnalisation** - Nom d'affichage et lien vers site web
- ✏️ **Édition facile** - Modal d'édition accessible
- 🎯 **Identification visuelle** - Badge "You" sur votre profil

### Interface
- 🌙 **Dark mode** - Support automatique
- 📱 **Responsive** - Mobile, tablet, desktop
- ⚡ **Performance** - Chargement ultra-rapide
- 🎨 **Design moderne** - Interface élégante avec Tailwind

## 🚀 Installation rapide

```bash
# 1. Cloner le projet
git clone https://github.com/yourusername/trustcode.git
cd trustcode

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
# Copiez .env.template en .env.local et remplissez les valeurs
# Voir la section Configuration ci-dessous

# 4. Vérifier la configuration
npm run check-env

# 5. Lancer l'application
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) 🎉

**Pour un guide étape par étape**, consultez [QUICKSTART.md](QUICKSTART.md)

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | **Démarrage en 5 minutes** ⚡ |
| [SETUP.md](SETUP.md) | Guide de configuration détaillé |
| [API.md](API.md) | Documentation de l'API |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Guide de déploiement (Vercel, VPS) |
| [CRON_SETUP.md](CRON_SETUP.md) | Configuration de l'automatisation (rafraîchissement toutes les 12h) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Comment contribuer |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Vue d'ensemble du projet |

## ⚙️ Configuration

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**C'est tout !** Supabase Auth gère l'authentification GitHub 🎉

### 2. Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com)

2. **Configurez GitHub OAuth** dans Authentication > Providers > GitHub
   - Activez GitHub OAuth
   - Copiez le Callback URL fourni par Supabase
   - Créez une OAuth App sur [GitHub](https://github.com/settings/developers)
   - Utilisez le Callback URL de Supabase (PAS localhost!)
   - Collez Client ID et Secret dans Supabase

3. **Exécutez le script SQL** dans SQL Editor :
   - Copiez le contenu de `supabase-schema.sql`
   - Exécutez-le pour créer la table `profiles`

4. **Récupérez vos clés** dans Settings > API :
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Installation

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build
npm start
```

## Structure du projet

```
trustcode/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── github/
│   │   │       ├── route.ts           # Initie l'OAuth GitHub
│   │   │       └── callback/
│   │   │           └── route.ts       # Callback OAuth
│   │   └── users/
│   │       ├── route.ts               # Liste des utilisateurs
│   │       └── [githubId]/
│   │           └── route.ts           # Mise à jour du profil
│   └── page.tsx                       # Page principale
├── components/
│   ├── ContributionGrid.tsx           # Grille de contributions
│   ├── UserList.tsx                   # Liste des utilisateurs
│   ├── GitHubConnectButton.tsx        # Bouton de connexion
│   └── ProfileModal.tsx               # Modal d'édition de profil
├── lib/
│   ├── supabase.ts                    # Client Supabase (browser)
│   ├── supabase-server.ts             # Client Supabase (server)
│   └── github.ts                      # API GitHub
├── types/
│   └── user.ts                        # Types TypeScript
└── supabase-schema.sql                # Schéma de base de données
```

## Utilisation

1. Cliquez sur "Connect GitHub" en haut à droite
2. Autorisez l'accès en lecture seule à votre GitHub
3. Vos contributions seront automatiquement récupérées et affichées
4. Vous pouvez éditer votre profil pour ajouter un nom d'affichage et un lien vers votre site
5. Le classement est automatiquement trié par nombre total de contributions

## 🛠️ Technologies utilisées

### Frontend
- **Next.js 15** - Framework React avec App Router
- **React 19** - Bibliothèque UI
- **TypeScript 5** - Typage statique
- **Tailwind CSS 4** - Styling moderne

### Backend
- **Next.js API Routes** - API serverless
- **Supabase** - Base de données PostgreSQL
- **GitHub OAuth** - Authentification sécurisée
- **GitHub GraphQL API** - Récupération des contributions

### Outils
- **date-fns** - Manipulation des dates
- **ESLint** - Linting
- **@supabase/ssr** - Client Supabase pour Next.js

## 📦 Structure du projet

```
trustcode/
├── app/                    # Application Next.js (App Router)
│   ├── api/               # Routes API
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Page d'accueil
│   └── globals.css        # Styles globaux
├── components/            # Composants React
│   ├── ContributionGrid.tsx
│   ├── UserList.tsx
│   ├── UserCard.tsx
│   ├── Statistics.tsx
│   └── ...
├── lib/                   # Utilitaires et helpers
│   ├── supabase.ts
│   ├── github.ts
│   └── ...
├── types/                 # Définitions TypeScript
├── scripts/               # Scripts utilitaires
└── public/               # Assets statiques
```

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

## 🐛 Signaler un bug

Ouvrez une [issue](https://github.com/yourusername/trustcode/issues) avec :
- Description du bug
- Étapes pour reproduire
- Comportement attendu vs actuel
- Captures d'écran si pertinent

## 📝 Roadmap

### Version 0.2.0
- [ ] Système de badges
- [ ] Graphiques de tendance
- [ ] Recherche d'utilisateurs
- [ ] Filtres par période

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet.

## 📄 License

MIT © TrustCode Team

## 🙏 Remerciements

- [GitHub](https://github.com) pour l'API GraphQL
- [Supabase](https://supabase.com) pour la base de données
- [Vercel](https://vercel.com) pour l'hébergement Next.js
- [Tailwind CSS](https://tailwindcss.com) pour le framework CSS

## 📧 Contact

- GitHub Issues: [Issues](https://github.com/yourusername/trustcode/issues)
- Email: support@trustcode.dev (à configurer)

---

<div align="center">

**⭐ N'oubliez pas de mettre une étoile si ce projet vous plaît ! ⭐**

Made with ❤️ by developers, for developers

</div>

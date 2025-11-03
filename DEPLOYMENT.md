# Guide de déploiement

Ce guide vous accompagne dans le déploiement de TrustCode en production.

## Prérequis

Avant de déployer:
- ✅ Application testée localement
- ✅ Projet Supabase configuré
- ✅ GitHub OAuth App créée (pour la production)
- ✅ Variables d'environnement prêtes

## Déploiement sur Vercel (Recommandé)

Vercel est la plateforme optimale pour Next.js.

### 1. Installation de Vercel CLI

```bash
npm install -g vercel
```

### 2. Connexion à Vercel

```bash
vercel login
```

### 3. Premier déploiement

```bash
# Depuis la racine du projet
vercel

# Suivez les instructions:
# - Confirmez le nom du projet
# - Confirmez le framework (Next.js sera détecté)
# - Confirmez le build command
```

### 4. Configuration des variables d'environnement

#### Via CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET

# Pour l'automatisation du rafraîchissement des contributions (optionnel)
vercel env add CRON_SECRET
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

#### Via Dashboard:

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Settings > Environment Variables
4. Ajoutez toutes les variables

**Important:** 
- `NEXTAUTH_URL` doit être votre domaine de production (ex: `https://trustcode.vercel.app`)
- Créez une nouvelle GitHub OAuth App avec l'URL de production
- Pour activer l'automatisation du rafraîchissement des contributions, consultez [CRON_SETUP.md](CRON_SETUP.md)

### 5. Déploiement en production

```bash
vercel --prod
```

### 6. Configuration du domaine personnalisé (Optionnel)

1. Dans Vercel Dashboard > Domains
2. Ajoutez votre domaine
3. Suivez les instructions DNS
4. Mettez à jour `NEXTAUTH_URL` et la GitHub OAuth App callback URL

## Déploiement sur Netlify

### 1. Via Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Connexion
netlify login

# Déploiement
netlify deploy --prod
```

### 2. Configuration

Créez `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Variables d'environnement

Site settings > Build & deploy > Environment > Environment variables

Ajoutez toutes les variables nécessaires.

## Déploiement sur un VPS (DigitalOcean, AWS, etc.)

### 1. Préparation du serveur

```bash
# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2
sudo npm install -g pm2
```

### 2. Cloner et build

```bash
# Cloner le repo
git clone https://github.com/yourusername/trustcode.git
cd trustcode

# Installer les dépendances
npm install

# Build
npm run build
```

### 3. Configuration des variables

Créez `.env.production`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=...
```

### 4. Lancer avec PM2

```bash
pm2 start npm --name "trustcode" -- start
pm2 save
pm2 startup
```

### 5. Configuration Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SSL avec Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Configuration GitHub OAuth pour la production

### Créer une OAuth App de production

1. GitHub Settings > Developer settings > OAuth Apps
2. New OAuth App
3. Configuration:
   - **Name**: TrustCode Production
   - **Homepage**: `https://yourdomain.com`
   - **Callback**: `https://yourdomain.com/api/auth/github/callback`
4. Copiez les credentials dans vos variables d'environnement

## Checklist pré-déploiement

- [ ] Tests locaux passent
- [ ] Variables d'environnement configurées
- [ ] GitHub OAuth App créée pour la production
- [ ] Supabase configuré
- [ ] `.env.local` n'est PAS commité (vérifier `.gitignore`)
- [ ] Build réussit sans erreurs (`npm run build`)
- [ ] Domaine configuré (si applicable)

## Checklist post-déploiement

- [ ] Application accessible sur l'URL de production
- [ ] Connexion GitHub fonctionne
- [ ] Contributions s'affichent correctement
- [ ] Édition de profil fonctionne
- [ ] Dark mode fonctionne
- [ ] Responsive design vérifié (mobile, tablet, desktop)
- [ ] Performance testée (Lighthouse)
- [ ] SSL actif (HTTPS)

## Monitoring et logs

### Vercel

- Logs disponibles dans le dashboard
- Analytics intégré

### VPS avec PM2

```bash
# Voir les logs
pm2 logs trustcode

# Monitoring
pm2 monit

# Status
pm2 status
```

## Mises à jour

### Vercel

```bash
# Commit et push
git add .
git commit -m "Update"
git push origin main

# Vercel déploie automatiquement
```

### VPS

```bash
# Sur le serveur
cd trustcode
git pull
npm install
npm run build
pm2 restart trustcode
```

## Backup

### Base de données Supabase

1. Supabase Dashboard > Database > Backups
2. Backups automatiques quotidiens inclus
3. Pour backup manuel: Database > SQL Editor > Export

### Code

- Code versé sur GitHub
- Backups automatiques avec Git

## Performance

### Optimisations recommandées

1. **CDN**: Vercel inclut un CDN global
2. **Images**: Next.js optimise automatiquement les images
3. **Caching**: Configuré par défaut avec Next.js
4. **Compression**: Activée automatiquement

### Monitoring de performance

- [Vercel Analytics](https://vercel.com/analytics)
- [Google Analytics](https://analytics.google.com)
- [Sentry](https://sentry.io) pour le monitoring d'erreurs

## Sécurité

### Checklist sécurité

- [ ] Variables d'environnement sécurisées
- [ ] HTTPS activé
- [ ] Rate limiting sur les APIs (à implémenter)
- [ ] CORS configuré correctement
- [ ] Dépendances à jour (`npm audit`)
- [ ] Row Level Security activé sur Supabase

### Mises à jour de sécurité

```bash
# Vérifier les vulnérabilités
npm audit

# Corriger automatiquement
npm audit fix
```

## Support

Si vous rencontrez des problèmes:
1. Consultez les logs de votre plateforme
2. Vérifiez la configuration des variables d'environnement
3. Testez localement avec les mêmes variables
4. Ouvrez une issue sur GitHub

## Rollback

### Vercel

Dans le dashboard: Deployments > Sélectionnez un déploiement précédent > Promote to Production

### VPS

```bash
git checkout <previous-commit>
npm install
npm run build
pm2 restart trustcode
```

---

**Note**: Ce guide suppose que vous avez les droits d'administration sur votre serveur/compte de déploiement.


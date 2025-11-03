# 🔄 Configuration de l'automatisation du rafraîchissement des contributions

Ce guide explique comment configurer l'automatisation pour rafraîchir automatiquement les contributions GitHub toutes les 12 heures.

## 📋 Vue d'ensemble

L'automatisation utilise :
- **Vercel Cron Jobs** pour planifier l'exécution toutes les 12 heures
- Une route API protégée `/api/cron/refresh-contributions` qui rafraîchit les contributions de tous les utilisateurs ayant un token GitHub

## 🚀 Configuration sur Vercel

### 1. Configurer les variables d'environnement

Ajoutez ces variables dans Vercel Dashboard > Settings > Environment Variables :

#### Variables requises pour le cron job :

```env
# Secret pour protéger l'endpoint cron (générez un secret aléatoire)
CRON_SECRET=your-super-secret-random-string-here

# Clé service role Supabase (pour accéder à tous les profils)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Comment obtenir SUPABASE_SERVICE_ROLE_KEY :

1. Allez dans votre dashboard Supabase
2. Settings > API
3. Copiez la **`service_role` key** (⚠️ NE JAMAIS l'exposer côté client !)

#### Comment générer CRON_SECRET :

```bash
# Générer un secret aléatoire (32 caractères)
openssl rand -hex 32

# Ou utiliser Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configuration du cron job

Le fichier `vercel.json` est déjà configuré avec le cron job :

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-contributions",
      "schedule": "0 */12 * * *"
    }
  ]
}
```

**Note :** Le cron job s'exécute toutes les 12 heures (`0 */12 * * *` signifie : à 00:00 et 12:00 UTC chaque jour).

### 3. Vérification du déploiement

Après avoir déployé sur Vercel :

1. Vérifiez que le cron job est actif :
   - Vercel Dashboard > Settings > Cron Jobs
   - Vous devriez voir `/api/cron/refresh-contributions` avec le schedule `0 */12 * * *`

2. Testez manuellement le cron job :

```bash
# Remplacer YOUR_CRON_SECRET par votre secret
curl -X GET "https://your-app.vercel.app/api/cron/refresh-contributions" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Vous devriez recevoir une réponse JSON avec :
```json
{
  "success": true,
  "message": "Refreshed contributions for X profiles",
  "updated": X,
  "failed": 0,
  "total": X,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔒 Sécurité

### Protection de l'endpoint

L'endpoint cron est protégé par :
- Un secret `CRON_SECRET` dans le header `Authorization: Bearer <secret>`
- Vercel Cron Jobs envoie automatiquement ce secret dans les headers

### Bonnes pratiques

1. **Ne jamais exposer `CRON_SECRET`** :
   - Ne le commitez pas dans git
   - Ne le partagez pas publiquement
   - Utilisez uniquement des variables d'environnement

2. **Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY`** :
   - Cette clé a accès complet à votre base de données
   - Ne l'utilisez que dans des routes API serveur
   - Ne l'exposez jamais côté client

3. **Gérer les erreurs** :
   - Le cron job continue même si un token est invalide
   - Les erreurs sont loggées mais ne bloquent pas les autres utilisateurs

## 📊 Monitoring

### Logs Vercel

Vous pouvez voir les logs du cron job dans :
- Vercel Dashboard > Logs
- Filtrez par `cron` pour voir uniquement les exécutions du cron job

### Logs de l'application

Le cron job log automatiquement :
- ✅ Succès : `Updated contributions for <username>`
- ❌ Erreurs : `Failed to update contributions for <username>: <error>`

## 🛠️ Configuration alternative (autres plateformes)

Si vous n'utilisez pas Vercel, vous pouvez utiliser un service externe :

### Option 1 : GitHub Actions (gratuit)

Créez `.github/workflows/refresh-contributions.yml` :

```yaml
name: Refresh Contributions

on:
  schedule:
    - cron: '0 */12 * * *'  # Toutes les 12 heures
  workflow_dispatch:  # Permet de déclencher manuellement

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X GET "${{ secrets.API_URL }}/api/cron/refresh-contributions" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Option 2 : Cron-job.org (gratuit)

1. Créez un compte sur [cron-job.org](https://cron-job.org)
2. Configurez un nouveau job :
   - URL : `https://your-app.vercel.app/api/cron/refresh-contributions`
   - Méthode : GET
   - Headers : `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule : Toutes les 12 heures

### Option 3 : Uptime Robot (gratuit)

Similaire à cron-job.org, avec monitoring en bonus.

## 🐛 Dépannage

### Le cron job ne s'exécute pas

1. **Vérifiez les variables d'environnement** :
   - `CRON_SECRET` est défini
   - `SUPABASE_SERVICE_ROLE_KEY` est défini
   - `NEXT_PUBLIC_SUPABASE_URL` est défini

2. **Vérifiez les logs Vercel** :
   - Vercel Dashboard > Logs
   - Cherchez les erreurs liées au cron job

3. **Testez manuellement** :
   ```bash
   curl -X GET "https://your-app.vercel.app/api/cron/refresh-contributions" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Erreur "Unauthorized"

- Vérifiez que `CRON_SECRET` correspond exactement à celui configuré dans Vercel
- Vérifiez que le header `Authorization: Bearer <secret>` est correct

### Erreur "Supabase credentials not configured"

- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est défini dans Vercel
- Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` est défini

### Les contributions ne sont pas mises à jour

- Vérifiez que les utilisateurs ont un `github_token` valide dans leur profil
- Vérifiez les logs pour voir quels profils ont échoué
- Les tokens GitHub expirés seront ignorés (mais pas supprimés)

## 📝 Notes importantes

1. **Tous les 12 heures** : Le cron job s'exécute à 00:00 et 12:00 UTC chaque jour
2. **Performance** : Le cron job traite tous les profils séquentiellement. Pour de grandes bases de données, envisagez de paralléliser ou de paginer
3. **Limites API GitHub** : GitHub a des limites de taux (5000 requêtes/heure). Le cron job devrait rester dans ces limites
4. **Tokens expirés** : Les tokens GitHub expirés seront ignorés. Les utilisateurs devront mettre à jour leur token manuellement

## 🔄 Modifier la fréquence

Pour changer la fréquence du cron job, modifiez `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-contributions",
      "schedule": "0 */6 * * *"  // Toutes les 6 heures
      // Ou "0 0 * * *" pour une fois par jour à minuit
      // Ou "0 */1 * * *" pour toutes les heures
    }
  ]
}
```

Format cron : `minute heure jour mois jour-semaine`
- `0 */12 * * *` = toutes les 12 heures (00:00 et 12:00)
- `0 0 * * *` = une fois par jour à minuit
- `0 */1 * * *` = toutes les heures
- `*/30 * * * *` = toutes les 30 minutes


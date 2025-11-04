# Migration des contributions quotidiennes

Ce script migre les données existantes de `contributions_data` (JSONB) vers la table `daily_contributions` pour tous les utilisateurs déjà inscrits.

## Prérequis

1. Avoir exécuté la migration SQL `003_add_daily_contributions_table.sql` dans Supabase
2. Avoir configuré la variable d'environnement `MIGRATION_SECRET` (optionnel, par défaut: `migration-secret-change-me`)

## Exécution

### Option 1: Via curl (recommandé)

```bash
curl -X POST http://localhost:3000/api/migrate-daily-contributions \
  -H "Authorization: Bearer migration-secret-change-me"
```

Pour la production:

```bash
curl -X POST https://votre-domaine.com/api/migrate-daily-contributions \
  -H "Authorization: Bearer votre-migration-secret"
```

### Option 2: Via un script Node.js

Créez un fichier `scripts/migrate-contributions.js`:

```javascript
const fetch = require('node-fetch');

const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'migration-secret-change-me';
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function migrate() {
  try {
    const response = await fetch(`${API_URL}/api/migrate-daily-contributions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MIGRATION_SECRET}`,
      },
    });

    const data = await response.json();
    console.log('Migration result:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

migrate();
```

Puis exécutez:

```bash
node scripts/migrate-contributions.js
```

## Résultat attendu

Le script retourne un JSON avec:

```json
{
  "success": true,
  "message": "Migration completed: X profiles migrated, Y failed",
  "migrated": 10,
  "failed": 0,
  "total": 10,
  "timestamp": "2025-01-XX..."
}
```

## Notes importantes

- ⚠️ Ce script peut être exécuté plusieurs fois en toute sécurité (utilise `upsert`)
- ⚠️ Les données existantes dans `daily_contributions` seront mises à jour si elles existent déjà
- ⚠️ Après cette migration initiale, les nouvelles contributions seront automatiquement ajoutées via:
  - L'inscription d'un nouvel utilisateur
  - La CRON quotidienne
  - Le refresh manuel des contributions

## Sécurité

Le script est protégé par un secret. Assurez-vous de:
1. Configurer `MIGRATION_SECRET` dans vos variables d'environnement
2. Ne pas exposer ce secret publiquement
3. Supprimer ou désactiver cette route après migration si vous le souhaitez


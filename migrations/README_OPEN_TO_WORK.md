# Open to Work & Business Partner Features - Migration Guide

Ces fonctionnalités permettent aux utilisateurs de :
1. Indiquer qu'ils sont disponibles pour des opportunités professionnelles ("Open to work")
2. Indiquer qu'ils recherchent un partenaire d'affaires ("Open for business partner")
3. Sélectionner les technologies/langages qu'ils maîtrisent
4. Afficher des badges dans le leaderboard pour être facilement repérables

## Migration de la base de données

Pour activer cette fonctionnalité, vous devez exécuter la migration SQL dans votre base de données Supabase.

### Étapes :

1. Connectez-vous à votre dashboard Supabase
2. Allez dans SQL Editor
3. Exécutez le script : `migrations/002_add_open_to_work.sql`

Ou via la ligne de commande :
```bash
psql -h [YOUR_SUPABASE_HOST] -U postgres -d postgres -f migrations/002_add_open_to_work.sql
```

## Fonctionnalités ajoutées

### 1. Page de profil (`/profile`)

Les utilisateurs peuvent maintenant :
- Activer/désactiver le statut "Open to work" via un toggle (bleu)
- Activer/désactiver le statut "Open for business partner" via un toggle (vert)
- Sélectionner les technologies qu'ils maîtrisent (JavaScript, Python, React, etc.)
- Les langages ne sont affichés que si "Open to work" est activé

### 2. Leaderboard

- Un badge vert "Open to work" ✓ s'affiche à côté du nom des utilisateurs disponibles pour un emploi
- Le badge affiche les compétences au survol (tooltip)
- Un badge jaune "💰 Partner" s'affiche pour les utilisateurs recherchant un partenaire d'affaires
- Les utilisateurs sont facilement repérables par les recruteurs et co-fondateurs potentiels

### 3. API

L'endpoint `/api/users/[githubId]` accepte maintenant trois nouveaux champs :
- `open_to_work` (boolean) : indique si l'utilisateur est disponible pour un emploi
- `open_for_partner` (boolean) : indique si l'utilisateur recherche un partenaire d'affaires
- `languages` (string[]) : liste des technologies maîtrisées

## Champs de base de données

Trois nouveaux champs ont été ajoutés à la table `profiles` :

```sql
open_to_work BOOLEAN DEFAULT FALSE      -- Statut "Open to work"
open_for_partner BOOLEAN DEFAULT FALSE  -- Statut "Open for business partner"
languages TEXT[] DEFAULT '{}'           -- Technologies/langages maîtrisés
```

Note: Les URLs multiples sont stockées dans le champ existant `website_url` sous forme de JSON array (pour plusieurs URLs) ou de texte simple (pour une seule URL).

## Technologies disponibles

Liste des technologies/langages proposés aux utilisateurs :
- Languages : JavaScript, TypeScript, Python, Java, C++, C#, Ruby, Go, Rust, PHP, Swift, Kotlin, Dart, SQL, HTML/CSS
- Frameworks : React, Vue.js, Angular, Node.js, Next.js, Django, Flask, Spring, Laravel, Rails, .NET, Flutter, React Native
- DevOps : Docker, Kubernetes, AWS, Azure, GCP
- Databases : MongoDB, PostgreSQL

## Badges visuels

### Badge "Open to work" (vert)
- Couleur : Vert
- Icône : ✓ (checkmark)
- Affiche les compétences au survol

### Badge "Open for partner" (jaune/or)
- Couleur : Jaune/Or
- Icône : 💰 (dollar emoji)
- Pour les utilisateurs recherchant un co-fondateur ou partenaire

## Notes

- Les utilisateurs existants auront `open_to_work = false` et `open_for_partner = false` par défaut
- La liste de langages peut être vide
- Les badges n'apparaissent que si les statuts correspondants sont à `true`
- Un utilisateur peut activer les deux badges simultanément


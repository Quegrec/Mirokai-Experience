# 🤖 Enchanted Tools — Centre Robotique

Application web éco-conçue pour la visualisation et le monitoring du centre robotique Enchanted Tools.

## ✨ Fonctionnalités

- **Carte interactive SVG** — Plan d'étage avec 4 zones cliquables
- **Sidebar d'information** — Détails des zones, capacité, robots présents
- **Dark Mode par défaut** — Réduction de la consommation énergétique
- **Éco-conception** — Polices système, assets optimisés, CSS purgé

## 🗺️ Zones du centre

| Zone | Description | Statut |
|------|-------------|--------|
| Mirokaï Experience | Démonstrations et expérience utilisateur | Actif |
| Zone Spoon | Service et assistance robotique | Actif |
| Régie | Centre de contrôle et supervision | Actif |
| Salle de Cyclage | Recharge et maintenance batteries | Maintenance |

## 📚 Documentation technique

- **Front-end** : application SvelteKit côté client/serveur avec rendu SSR et hydratation côté navigateur.
- **Données** : toutes les données de configuration (parcours, modules, mini-jeux, fond de carte) sont stockées dans **Supabase** (Postgres) via les tables :
  - **`modules`** : étapes principales du parcours (nom, description, type, durée estimée, position sur la carte, zone associée, etc.).
  - **`mini_games`** : mini-jeux optionnels qui se déclenchent après certains modules (type de jeu, contenu, récompenses, lien vers un module via `after_module_id`).
  - **`settings`** : paramètres globaux de l'expérience (ex. `journey_background_url`, type de fond de carte).
- **État côté client** :
  - Svelte stores pour l'état de l'UI (module sélectionné, quiz, statistiques…).
  - **`sessionStorage`** pour la persistance légère de la session :
    - `mirokai-progress` : progression du parcours (nœuds complétés, nœud courant, score utilisateur).
    - `mirokai-onboarding` : informations d'onboarding (ex. nom de l'équipe).
- **API / Accès aux données** :
  - Client Supabase créé côté navigateur/serveur à partir des variables d'environnement **`PUBLIC_SUPABASE_URL`** et **`PUBLIC_SUPABASE_ANON_KEY`**.
  - Lecture des tables `modules`, `mini_games` et `settings` au chargement de la page de parcours.

## 🏗️ Schéma d’architecture (vue d’ensemble)

Flux simplifié de l’application :

```text
Navigateur (SvelteKit + JourneyMap)
    │
    │  HTTP(S) + Supabase JS Client
    ▼
Backend Supabase (Postgres + API)
    ├─ Table `modules`      → étapes et contenu du parcours
    ├─ Table `mini_games`   → mini‑jeux rattachés aux modules
    └─ Table `settings`     → paramètres globaux (fond de carte, etc.)
```

- **Navigateur** : affiche la carte (`JourneyMap`), les modales de modules/quiz, et calcule les statistiques de progression.
- **Supabase** : sert de base de données et d’API pour la configuration du parcours, sans backend custom supplémentaire.
- **Stockage local** : la progression de l'équipe est conservée côté navigateur uniquement (aucune écriture en base, pas de tracking nominatif).

## 🛠️ Stack technique

- **Framework** : SvelteKit + Vite
- **Styling** : Tailwind CSS v4
- **Icônes** : Lucide-Svelte
- **État** : Svelte Stores

## 🚀 Installation & lancement en local

1. **Prérequis**
   - Node.js LTS installé
   - Un projet **Supabase** configuré (URL et clé publique disponibles)
2. **Cloner le dépôt**

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

### ⚙️ Configuration Supabase

Créez (ou complétez) un fichier `.env` à la racine avec les variables publiques :

```bash
PUBLIC_SUPABASE_URL="https://votre-projet.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="votre_cle_anon_publique"
```

Ces valeurs doivent correspondre à votre projet Supabase contenant les tables `modules`, `mini_games` et `settings`.

## 📦 Build production

```bash
npm run build
npm run preview
```

## 📁 Structure du projet

```
src/
├── lib/
│   ├── components/
│   │   ├── InteractiveMap.svelte   # Carte SVG interactive
│   │   └── Sidebar.svelte          # Fiche d'info latérale
│   ├── data/
│   │   └── zones.ts                # Données des zones
│   └── stores/
│       └── selectedZone.ts         # Store Svelte
└── routes/
    ├── +layout.svelte              # Layout global
    └── +page.svelte                # Page principale du parcours
```

## 🔐 Guide d’utilisation admin

L’administration de l’expérience se fait depuis l’interface **Supabase** (ou tout autre outil connecté à la même base Postgres).

- **Accès à Supabase**
  - Connectez‑vous au projet Supabase dont les identifiants sont utilisés dans `PUBLIC_SUPABASE_URL` et `PUBLIC_SUPABASE_ANON_KEY`.
  - Ouvrez l’onglet **Table Editor**.

- **Table `modules`** – Gérer les étapes du parcours
  - Chaque ligne représente un **module** affiché sur la carte.
  - Champs principaux :
    - `nom` : titre du module affiché à l’utilisateur.
    - `description` : texte de description dans la modale.
    - `type` : type fonctionnel (`video`, `interaction`, `quiz`, `info`, `experience`).
    - `status` : état du module (`actif`, `brouillon`, `archive`) – seuls les modules **actifs** sont utilisés dans le parcours.
    - `ordre` : ordre d’affichage / de progression.
    - `duree_estimee` : durée estimée (en minutes) utilisée pour le calcul de la durée totale.
    - `zone_id` : zone du centre à laquelle le module est rattaché (ex. "mirokai_experience", "spoon", etc.).
    - `position` : coordonnées `{ x, y }` en pourcentage pour placer le module sur la carte.
    - `contenu` : objet JSON avec le détail du contenu (texte, médias, instructions).

- **Table `mini_games`** – Gérer les mini‑jeux
  - Permet d’ajouter des mini‑jeux déclenchés après certains modules.
  - Champs principaux :
    - `nom`, `description` : informations affichées à l’utilisateur.
    - `type` : type de jeu (`memory`, `puzzle`, `quiz_flash`, `drag_drop`, `find_difference`, `sequence`…).
    - `status` : même logique que pour les modules (`actif`, `brouillon`, `archive`).
    - `after_module_id` : identifiant du module après lequel le mini‑jeu apparaît.
    - `ordre` : ordre si plusieurs mini‑jeux suivent le même module.
    - `contenu` : configuration JSON du mini‑jeu (questions, paires à retrouver, temps limite, etc.).

- **Table `settings`** – Paramètres globaux
  - Généralement une seule ligne avec `id = "main"`.
  - Champs principaux :
    - `journey_background_url` : URL du fond de carte personnalisé.
    - `journey_background_type` : `'image'` ou `'generated'` selon que l’on utilise une image custom ou un tracé généré automatiquement.

### Bonnes pratiques admin

- Utilisez `status = 'brouillon'` pour préparer des contenus sans les rendre visibles.
- Gardez une cohérence entre les `ordre` des modules / mini‑jeux pour éviter des sauts dans le parcours.
- Testez systématiquement le parcours en local après modifications des données.

## 📊 Exemples de données

### Exemple de module (`modules`)

```json
{
  "id": "module-intro-miokai",
  "nom": "Bienvenue dans Mirokaï Experience",
  "description": "Introduction au parcours et aux robots Enchanted Tools.",
  "type": "experience",
  "status": "actif",
  "ordre": 1,
  "duree_estimee": 5,
  "zone_id": "mirokai_experience",
  "position": { "x": 32, "y": 68 },
  "contenu": {
    "mediaUrl": "https://cdn.example.com/videos/intro.mp4",
    "texte": "Découvrez l'univers de Mirokaï et les différentes zones du centre.",
    "instructions": [
      "Regardez la vidéo de présentation.",
      "Suivez les indications sur l'écran de la borne.",
      "Passez au module suivant lorsque vous êtes prêts."
    ]
  }
}
```

### Exemple de mini‑jeu (`mini_games` de type quiz)

```json
{
  "id": "quiz-miokai-base",
  "nom": "Quiz Mirokaï",
  "description": "Validez vos connaissances sur Mirokaï.",
  "type": "quiz_flash",
  "status": "actif",
  "after_module_id": "module-intro-miokai",
  "ordre": 1,
  "duree_estimee": 3,
  "contenu": {
    "questions": [
      {
        "question": "Combien de zones comporte le centre ?",
        "options": ["2", "3", "4"],
        "correctIndex": 2
      },
      {
        "question": "Quel espace est dédié à la recharge des batteries ?",
        "options": ["Zone Spoon", "Régie", "Salle de Cyclage"],
        "correctIndex": 2
      }
    ],
    "timeLimit": 120,
    "difficulty": "easy"
  },
  "recompense": {
    "points": 50,
    "badge": "Explorateur Mirokaï"
  }
}
```

## ☁️ Instructions de déploiement

Le projet est un SvelteKit + Vite classique et peut être déployé sur Vercel, Netlify ou tout autre hébergeur compatible.

1. **Préparer l’environnement**
   - Vérifiez que les variables d’environnement `PUBLIC_SUPABASE_URL` et `PUBLIC_SUPABASE_ANON_KEY` sont définies sur votre plateforme de déploiement.
   - Configurez les règles CORS de Supabase si nécessaire pour autoriser le domaine de production.
2. **Build de production**

   ```bash
   npm run build
   ```

3. **Exemple : déploiement sur Vercel**
   - Importez le dépôt dans Vercel.
   - Vercel détecte automatiquement SvelteKit.
   - Ajoutez les variables d’environnement (onglet **Settings → Environment Variables**).
   - Déclenchez un déploiement ; l’URL de production servira ensuite d’URL officielle de l’expérience.

4. **Vérifications post‑déploiement**
   - Tester le parcours complet (modules + mini‑jeux).
   - Vérifier le chargement du fond de carte (`journey_background_url`).
   - Tester l’expérience sur les principaux navigateurs et en mode plein écran sur les bornes prévues.

## 🌱 Éco-conception

- ✅ Polices système (aucun import externe)
- ✅ Dark Mode par défaut (économie d'énergie écrans OLED)
- ✅ CSS purgé automatiquement (Tailwind + Vite)
- ✅ Animations respectant `prefers-reduced-motion`
- ✅ Assets optimisés via Vite

---

**Enchanted Tools** © 2026

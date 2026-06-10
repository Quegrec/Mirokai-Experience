# Mirokaï Experience

Application web interactive pour piloter et animer le parcours de découverte des robots Enchanted Tools.

---

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Guide administrateur](#guide-administrateur)
   - [Se connecter](#se-connecter)
   - [Gérer les modules](#gérer-les-modules)
   - [Gérer les mini-jeux et quiz](#gérer-les-mini-jeux-et-quiz)
   - [Image de fond de la carte](#image-de-fond-de-la-carte)
   - [Transcription automatique des audioguides](#transcription-automatique-des-audioguides)
3. [Fonctionnalités côté visiteur](#fonctionnalités-côté-visiteur)
4. [Architecture technique](#architecture-technique)
5. [Installation & configuration](#installation--configuration)
6. [Déploiement](#déploiement)

---

## Vue d'ensemble

Mirokaï Experience est une **Progressive Web App (PWA)** conçue pour être utilisée sur tablette ou borne tactile lors des visites du centre robotique Enchanted Tools.

Le visiteur suit un parcours guidé sur une carte interactive, découvre des modules (audioguides, vidéos, expériences), répond à des quiz, et progresse étape par étape jusqu'à la fin de l'aventure.

Tout le contenu (modules, quiz, images) est géré depuis l'**interface d'administration intégrée**, sans toucher au code.

---

## Guide administrateur

### Se connecter

1. Ouvrez l'application et ajoutez `/admin` à l'URL (ex. `https://votre-app.vercel.app/admin`).
2. Saisissez vos identifiants (email + mot de passe configurés dans Supabase Authentication).
3. Vous accédez au tableau de bord avec les sections **Modules**, **Mini-jeux** et **Paramètres**.

> ⚠️ Ne partagez jamais vos identifiants admin. Si vous devez en créer de nouveaux, rendez-vous dans votre projet Supabase → **Authentication → Users**.

---

### Gérer les modules

Les **modules** sont les étapes principales du parcours (bulles sur la carte).

#### Créer un module

1. Admin → **Modules** → **Nouveau module**.
2. Remplissez les champs :

| Champ | Description |
|---|---|
| **Nom** | Titre affiché dans la modale visiteur |
| **Description** | Texte d'introduction de l'étape |
| **Type** | Voir tableau ci-dessous |
| **Statut** | `Actif` = visible sur la carte · `Brouillon` = invisible · `Archivé` = retiré |
| **Durée estimée** | En minutes, utilisé pour le compteur total de la visite |
| **Zone associée** | Zone physique du centre correspondante |
| **URL de l'audioguide** | URL publique du fichier audio (MP3, MP4…) |
| **Texte / Script** | Transcript de l'audio — devient les sous-titres synchronisés |
| **Position sur la carte** | Réglé graphiquement via l'éditeur de carte |

#### Types de modules et leur effet visuel

| Type | Icône sur la carte | Usage recommandé |
|---|---|---|
| `video` | ▶ Triangle Play | Modules avec un audioguide ou une vidéo |
| `interaction` | Main | Étapes demandant une action physique |
| `quiz` | Point d'interrogation | Étapes uniquement quiz (sans audio) |
| `info` | ℹ | Panneaux d'information statique |
| `experience` | Étincelles | Étapes d'expérience immersive |

> 💡 Choisissez `video` dès qu'un audioguide est associé au module : l'icône ▶ indique clairement au visiteur qu'il y a quelque chose à écouter.

#### Placer un module sur la carte

Allez dans Admin → **Éditeur de carte**. Glissez-déposez les modules sur l'image de fond pour les repositionner. La position est sauvegardée en pourcentage (adaptée à toutes tailles d'écran).

---

### Gérer les mini-jeux et quiz

Les **mini-jeux** (quiz) s'affichent après un module choisi. Ils permettent de valider les connaissances du visiteur avant de débloquer l'étape suivante.

#### Créer un quiz

1. Admin → **Mini-jeux** → **Nouveau mini-jeu**.
2. Choisissez le module après lequel il apparaîtra (`Après le module`).
3. Dans la section **Questions**, trois onglets sont disponibles :

| Onglet | Utilisation |
|---|---|
| **Standard** | Questions affichées si aucun mode n'est sélectionné (défault) |
| **Famille** | Questions grand public, accessibles à tous les âges |
| **Tech** | Questions avancées pour les visiteurs avec un profil technique |

> 💡 **Fonctionnement du mode :** à l'arrivée sur l'application, le visiteur choisit entre *Mode Famille* et *Mode Tech*. Le quiz lui posera automatiquement les questions de son onglet. Si l'onglet est vide, les questions Standard s'affichent à la place.

#### Rédiger une question

Chaque question doit comporter **exactement 4 réponses**. Cochez la bonne réponse avec le bouton radio à gauche. Toute question incomplète (intitulé vide ou moins de 4 réponses renseignées) est ignorée à la sauvegarde.

---

### Image de fond de la carte

L'image de fond donne son ambiance visuelle à la carte du parcours.

1. Admin → **Paramètres** → section **Image de fond du parcours**.
2. Deux options :
   - **Uploader une image** : format portrait recommandé (ratio 9:16), PNG ou JPG, max 5 MB.
   - **Choisir dans le bucket** : réutilisez une image déjà uploadée.
3. Cliquez sur l'image souhaitée pour l'activer immédiatement.

> ℹ️ Si aucune image n'est configurée, un fond généré automatiquement s'affiche (dégradé animé avec particules).

---

### Transcription automatique des audioguides

Le champ **Texte / Script** d'un module sert à afficher des **sous-titres synchronisés** pendant la lecture de l'audioguide. Plutôt que de le saisir manuellement, vous pouvez le générer automatiquement.

#### Prérequis

Créez un compte gratuit sur [assemblyai.com](https://www.assemblyai.com) et copiez votre clé API dans le fichier `.env` :

```
ASSEMBLYAI_API_KEY = votre_clé_ici
```

#### Utilisation

1. Ouvrez un module dans l'admin et renseignez l'URL de l'audioguide.
2. Le bouton **🎙️ Transcrire avec Whisper** apparaît à côté du champ Texte / Script.
3. Cliquez dessus — la transcription prend 30 à 90 secondes selon la durée de l'audio.
4. Le texte généré s'affiche dans le champ. Relisez-le, corrigez si besoin, puis sauvegardez.

> ℹ️ Le tier gratuit d'AssemblyAI offre 5 heures de transcription par mois, sans carte bancaire requise. Les fichiers de toutes tailles sont acceptés.

---

## Fonctionnalités côté visiteur

### Onboarding

À l'arrivée sur l'application, le visiteur :
1. Choisit son **mode** (*Famille* ou *Tech*) qui adaptera les questions des quiz.
2. Renseigne le **nom de son équipe** et le nombre d'aventuriers.
3. Est redirigé vers la carte du parcours.

### Vidéo d'introduction

Une **vidéo YouTube** se lance automatiquement en plein écran à la première visite de la carte. Elle peut être fermée à tout moment. L'URL de la vidéo se configure directement dans le code (`youtubeVideoId` dans `src/routes/journey/+page.svelte`).

> 📌 À remplacer par le lien YouTube non-répertorié fourni par le client.

### Carte interactive

- Les **modules complétés** s'affichent avec une coche verte.
- Le **module en cours** pulse pour attirer l'attention.
- Les **modules non débloqués** sont verrouillés et apparaissent en niveaux de gris (la partie non explorée de la carte est automatiquement désaturée).
- Les **modules vidéo** affichent un triangle ▶ à la place du numéro.

### Animation de progression

Quand le visiteur atteint **le tiers du parcours**, une animation de fiole qui se remplit apparaît pour célébrer sa progression.

> 📌 Asset placeholder SVG actuellement utilisé — à remplacer par le visuel final fourni par le client.

### Modules audio avec sous-titres

Le player audio intégré affiche les sous-titres en temps réel, phrase par phrase, synchronisés avec la lecture. Le texte défile automatiquement.

### Quiz adaptatifs

Les questions posées correspondent au mode choisi en début de parcours (Famille ou Tech). Le score est affiché dans le compteur en haut de la carte.

---

## Architecture technique

```
src/
├── lib/
│   ├── components/
│   │   ├── AudioPlayer.svelte       # Player audio custom avec sous-titres
│   │   ├── HelpTip.svelte           # Bulles d'aide dans l'admin
│   │   ├── InteractiveMap.svelte    # Carte SVG interactive
│   │   ├── JourneyMap.svelte        # Carte du parcours + fog of war
│   │   ├── JourneyNode.svelte       # Nœud individuel sur la carte
│   │   ├── ModuleMapEditor.svelte   # Éditeur visuel de positions
│   │   ├── Sidebar.svelte           # Panneau latéral
│   │   └── VialAnimation.svelte    # Animation fiole 1/3 parcours
│   ├── data/
│   │   ├── modules.ts               # Données statiques de fallback
│   │   └── zones.ts                 # Liste des zones du centre
│   ├── stores/
│   │   ├── miniGamesStore.ts        # État et CRUD mini-jeux
│   │   ├── modulesStore.ts          # État et CRUD modules
│   │   ├── selectedZone.ts          # Zone sélectionnée
│   │   └── settingsStore.ts         # Paramètres globaux
│   └── supabase/
│       ├── client.ts                # Initialisation Supabase (SSR/browser)
│       └── types.ts                 # Types TypeScript de la base
├── routes/
│   ├── +page.svelte                 # Page d'onboarding (choix mode + équipe)
│   ├── journey/+page.svelte         # Carte du parcours (page principale)
│   ├── api/
│   │   ├── auth/logout/             # Route de déconnexion
│   │   └── transcribe/+server.ts   # Proxy AssemblyAI (transcription audio)
│   └── (app)/admin/
│       ├── +page.svelte             # Tableau de bord admin
│       ├── map-editor/              # Éditeur visuel de la carte
│       ├── modules/                 # CRUD modules
│       ├── minigames/               # CRUD mini-jeux / quiz
│       └── settings/                # Paramètres (fond de carte, etc.)
```

### Base de données (Supabase)

| Table | Rôle |
|---|---|
| `modules` | Étapes du parcours (contenu, position, type, statut…) |
| `mini_games` | Quiz associés aux modules, questions par mode |
| `settings` | Configuration globale (image de fond, etc.) |

Le champ `contenu` est du **JSONB libre** — sa structure varie selon le type de module ou de jeu :

```jsonc
// Module avec audioguide
{
  "mediaUrl": "https://...",          // URL de l'audio
  "texte": "Bienvenue dans...",       // Script = sous-titres
  "instructions": ["Étape 1", ...]
}

// Mini-jeu quiz avec modes
{
  "questions": [...],                  // Défault
  "questions_famille": [...],          // Mode Famille
  "questions_tech": [...]              // Mode Tech
}
```

### État côté client (sessionStorage)

| Clé | Contenu |
|---|---|
| `mirokai-onboarding` | `{ mode, teamName, adventurersCount }` |
| `mirokai-progress` | `{ completed: string[], current: string, score: number }` |
| `mirokai-video-seen` | `'true'` si la vidéo d'intro a déjà été vue cette session |
| `mirokai-vial-shown` | `'true'` si l'animation fiole a déjà été montrée cette session |

---

## Installation & configuration

### Prérequis

- Node.js LTS (v18+)
- Un projet [Supabase](https://supabase.com) avec les tables créées (voir `supabase-schema.sql`)

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env
cp .env.example .env  # ou créer manuellement
```

Remplissez le fichier `.env` :

```bash
# Supabase (obligatoire)
PUBLIC_SUPABASE_URL   = https://votre-projet.supabase.co
PUBLIC_SUPABASE_ANON_KEY = eyJ...   # clé "anon public" (commence par eyJ)

# AssemblyAI (optionnel — uniquement pour la transcription automatique)
ASSEMBLYAI_API_KEY = votre_clé
```

> ⚠️ La `PUBLIC_SUPABASE_ANON_KEY` doit commencer par `eyJ`. Si elle commence par `sb_secret_`, c'est la clé de service — elle ne doit pas être utilisée ici.

```bash
# 3. Initialiser la base de données
# Exécutez supabase-schema.sql dans l'éditeur SQL de votre projet Supabase

# 4. Lancer en développement
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

---

## Déploiement

Le projet est compatible avec Vercel, Netlify, et tout hébergeur Node.js.

### Vercel (recommandé)

1. Importez le dépôt dans [Vercel](https://vercel.com).
2. SvelteKit est détecté automatiquement.
3. Ajoutez les variables d'environnement dans **Settings → Environment Variables** :
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `ASSEMBLYAI_API_KEY` (si transcription utilisée)
4. Déployez.

### Vérifications post-déploiement

- [ ] Parcours complet accessible sans erreur
- [ ] Modules et quiz chargent depuis Supabase
- [ ] Image de fond de carte s'affiche
- [ ] Vidéo d'intro se lance (penser à remplacer le placeholder)
- [ ] Transcription automatique fonctionnelle (si clé AssemblyAI configurée)
- [ ] Interface admin accessible via `/admin`

---

**Enchanted Tools** © 2026

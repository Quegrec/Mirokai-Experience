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

## 🛠️ Stack technique

- **Framework** : SvelteKit + Vite
- **Styling** : Tailwind CSS v4
- **Icônes** : Lucide-Svelte
- **État** : Svelte Stores

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

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
    └── +page.svelte                # Page principale
```

## 🌱 Éco-conception

- ✅ Polices système (aucun import externe)
- ✅ Dark Mode par défaut (économie d'énergie écrans OLED)
- ✅ CSS purgé automatiquement (Tailwind + Vite)
- ✅ Animations respectant `prefers-reduced-motion`
- ✅ Assets optimisés via Vite

---

**Enchanted Tools** © 2026

# Hamza — Le Monde (Palier 1)

Site Next.js + react-three-fiber. Palier 1 : la scène 3D (cristal + bloom crimson + parallaxe).

## Arborescence exacte du repo

Recrée EXACTEMENT cette structure dans ton repo GitHub (les chemins comptent) :

```
hamza-monde/
├── package.json
├── next.config.mjs
├── tsconfig.json
├── next-env.d.ts
├── .gitignore
├── README.md
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
└── components/
    ├── World.tsx
    └── WorldScene.tsx
```

⚠️ Ne crée PAS de dossier `node_modules` et ne dépose aucun fichier dedans — Vercel l'installe tout seul à partir du `package.json`.

## Mise en ligne (sans terminal)

1. Sur GitHub : crée un nouveau repo (ex. `hamza-monde`).
2. Dépose chaque fichier à son emplacement exact. Pour créer un fichier dans un dossier, utilise « Add file → Create new file » et tape le chemin complet dans le nom, ex. `app/page.tsx` — GitHub crée le dossier automatiquement.
3. Va sur vercel.com → « Add New… → Project » → importe ton repo GitHub.
4. Vercel détecte Next.js tout seul. Ne change AUCUN réglage. Clique « Deploy ».
5. Attends ~1 à 2 minutes. Tu obtiens une URL `.vercel.app`.

## Ce que tu dois voir

Un cristal sombre facetté qui tourne lentement, ses arêtes crimson qui **rayonnent** (le bloom), la scène qui suit ta souris en parallaxe, et le titre « Hamza El Jaouahiry » par-dessus.

## Si le build échoue

Copie l'erreur exacte affichée par Vercel (onglet du déploiement → logs) et envoie-la. La cause la plus fréquente est un fichier mal placé ou un nom de chemin incorrect.

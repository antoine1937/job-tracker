# Job Tracker

Mon outil perso pour suivre ma recherche d'emploi — un CRUD complet avec un vrai backend, pour la partie "full stack" de mon portfolio.

## Fonctionnalités

- Ajouter, modifier et supprimer une candidature (entreprise, poste, statut, date, lien de l'offre, notes)
- 5 statuts : À postuler, Envoyée, Entretien, Refusée, Offre
- Filtrer la liste par statut
- Bandeau de statistiques : une barre proportionnelle + légende, qui montre la répartition des candidatures par statut
- Animations : apparition en cascade des cartes, disparition animée à la suppression, mise en avant du formulaire à la modification

## Stack technique

- **Backend** : Node.js + [Express](https://expressjs.com/) pour l'API REST
- **Base de données** : [`node:sqlite`](https://nodejs.org/api/sqlite.html), le module SQLite intégré à Node.js — pas de dépendance native à compiler, ça fonctionne partout où Node.js tourne
- **Frontend** : HTML/CSS/JavaScript vanilla, servi directement par Express (pas de framework ici, c'est volontaire — le projet React est un projet à part dans le portfolio)

## API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/applications` | Liste les candidatures (filtre optionnel `?status=`) |
| GET | `/api/applications/:id` | Détail d'une candidature |
| POST | `/api/applications` | Crée une candidature |
| PUT | `/api/applications/:id` | Met à jour une candidature |
| DELETE | `/api/applications/:id` | Supprime une candidature |
| GET | `/api/stats` | Nombre de candidatures par statut |

## Lancer le projet en local

```
npm install
npm start
```

Puis ouvrir [http://localhost:3000](http://localhost:3000). La base de données (`job-tracker.db`) est créée automatiquement au premier lancement.

## Ce que ce projet démontre

- Construction d'une API REST avec CRUD complet (Create, Read, Update, Delete)
- Modélisation d'une base de données relationnelle simple (SQL, requêtes préparées)
- Agrégation SQL (`GROUP BY`) pour les statistiques
- Communication frontend/backend en JSON via `fetch`
- Animations CSS/JS pilotées par l'état de l'application

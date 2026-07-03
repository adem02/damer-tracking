# Live tracking des dameuses

Suivi temps réel de dameuses : rejoue des positions GPS, les diffuse en
WebSocket et calcule des métriques spatiales (positions courantes, présence
dans une zone, distance parcourue dans la zone).

## Lancement

### Prérequis

- Docker
- Docker Compose

Tout tourne en conteneurs : aucune installation locale de Node ou de
PostgreSQL n'est nécessaire.

### Démarrer l'application

```bash
docker compose up --build
```

Cette commande démarre trois services :

| Service    | URL                        | Description               |
| ---------- | -------------------------- | ------------------------- |
| Frontend   | http://localhost:5173      | Interface de suivi        |
| API        | http://localhost:3000      | API REST + WebSocket      |
| Swagger    | http://localhost:3000/docs | Documentation interactive |
| PostgreSQL | localhost:5432             | Base PostGIS              |

Au démarrage, le backend génère le client Prisma, applique les migrations puis
lance le serveur en mode watch. La configuration provient du fichier `.env` à
la racine.

### Arrêter l'application

```bash
docker compose down
```

Pour repartir d'une base vierge (supprime le volume PostgreSQL) :

```bash
docker compose down -v
```

## Conception

### Structure du backend NestJS

Le backend est découpé en modules, chacun répondant à un besoin métier qui lui
est propre. L'objectif : une architecture inspirée de la clean architecture,
mais volontairement mesurée et simple — pas d'abstraction gratuite, priorité à
la lisibilité et à la maintenabilité.

| Module       | Responsabilité                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `machines`   | Domaine des dameuses : entités et port `MachineRepository`. Son implémentation Prisma/PostGIS vit dans une couche `infrastructure` séparée. Module partagé par les autres. |
| `tracking`   | API REST de consultation : positions courantes, présence en zone, trace, distance parcourue dans la zone.                                                   |
| `simulation` | Rejoue les positions du jeu de données et pilote le cycle de vie de la simulation.                                                                          |
| `streaming`  | Diffusion temps réel des positions via WebSocket.                                                                                                           |
| `common`     | Configuration validée, accès Prisma et éléments transverses.                                                                                               |

Ce découpage limite le couplage : le domaine (`machines`) est isolé derrière
un port, si bien que la logique de lecture (`tracking`) et la logique
d'écriture (`simulation`) s'appuient sur la même abstraction sans se connaître.
Chaque module reste ainsi remplaçable et testable indépendamment.

### Temps réel

Le temps réel repose sur les **WebSockets** (Socket.IO). Chaque position
rejouée par la simulation est immédiatement émise au front, qui met à jour la
carte sans rechargement.

Avec le recul, un besoin aussi simple (flux unidirectionnel serveur → client)
aurait tout aussi bien pu être couvert par les **Server-Sent Events**, natifs
dans NestJS et sans dépendance externe. Le WebSocket reste toutefois un choix
pertinent si le besoin évolue vers de la communication bidirectionnelle.

### Hypothèses

- La **zone d'analyse** est une constante en mémoire, suffisante pour le
  périmètre de l'exercice (une zone unique et fixe).
- La **simulation est déclenchée par le front**, via des événements WebSocket
  (`start-simulation` / `reset-simulation`), pour garder la main sur les
  données en base.
- Le front appelle les endpoints spatiaux **toutes les 5 positions reçues**
  et à l'arrêt de la simulation, pour éviter de surcharger la base avec des
  requêtes coûteuses à chaque tick.
- Le front utilise **MapLibre**, fork open source de Mapbox GL JS, pour
  l'affichage cartographique — même API, même rendu WebGL, sans contrainte de
  licence.

### Avec plus de temps

- **Protocole MQTT** : remplacer le scheduler interne par un vrai broker MQTT
  (Mosquitto) pour se rapprocher de l'architecture réelle — chaque dameuse
  publie ses positions sur un topic, l'API souscrit et les persiste.
- **Server-Sent Events** : implémenter une branche alternative SSE pour le flux
  unidirectionnel serveur → client, plus légère que WebSocket pour ce cas
  d'usage précis.
- **Observabilité** : logs structurés, métriques Prometheus, traces distribuées
  et intégration Sentry pour le suivi des erreurs en production.
- **Tests** : compléter la couverture avec des tests e2e sur le flux complet simulation → WebSocket
  → front.
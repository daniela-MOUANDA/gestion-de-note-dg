# Deploy VPS (test)

Cette configuration permet de garder le `localhost` en local et d'utiliser une configuration VPS séparée.

## Ports VPS demandés

- Frontend: `4500`
- Backend: `4501`
- IP serveur: `195.35.3.54`

## Fichiers utilises

- Front/Global: `.env.vps`
- Backend: `server/.env.vps`

## Lancer en mode VPS

Frontend:

```bash
npm run dev:vps
```

Backend:

```bash
npm run server:vps
```

## En local (inchangé)

Tu continues avec tes commandes habituelles (`npm run dev`, `npm run server`), et les valeurs `localhost` restent actives.

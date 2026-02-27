# Stoat Backend API

Backend Node.js pour l'application de chat Stoat avec MySQL.

## Installation

1. Installer les dépendances :
```bash
cd backend
npm install
```

2. Configurer la base de données MySQL :
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Modifier .env avec vos configurations
DATABASE_URL="mysql://username:password@localhost:3306/stoat_db"
JWT_SECRET=votre-secret-jet-secu
```

3. Générer le client Prisma :
```bash
npx prisma generate
```

4. Appliquer les migrations :
```bash
npx prisma db push
```

## Démarrage

### Développement
```bash
npm run dev
```

### Production
```bash
npm start
```

L'API démarrera sur le port `14702` (compatible avec le frontend Stoat).

## Routes API

### Authentification
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/logout` - Déconnexion

### Utilisateurs
- `GET /users/@me` - Profil utilisateur
- `PATCH /users/@me` - Modifier profil
- `GET /users/:id` - Info utilisateur public

### Serveurs
- `GET /servers` - Liste serveurs
- `POST /servers` - Créer serveur
- `GET /servers/:id` - Détails serveur
- `PATCH /servers/:id` - Modifier serveur
- `DELETE /servers/:id` - Supprimer serveur

### Canaux
- `GET /channels/server/:serverId` - Canaux d'un serveur
- `POST /channels/server/:serverId` - Créer canal
- `GET /channels/:id` - Détails canal
- `PATCH /channels/:id` - Modifier canal
- `DELETE /channels/:id` - Supprimer canal

### Messages
- `GET /messages/channel/:channelId` - Messages d'un canal
- `POST /messages/channel/:channelId` - Envoyer message
- `GET /messages/:id` - Détails message
- `PATCH /messages/:id` - Modifier message
- `DELETE /messages/:id` - Supprimer message

### Invitations
- `GET /invites/:code` - Infos invitation
- `POST /invites` - Créer invitation
- `POST /invites/:code/join` - Rejoindre serveur

### Bots
- `GET /bots/:id/invite` - Invitation bot (public)
- `GET /bots` - Liste bots (propriétaire)
- `POST /bots` - Créer bot
- `GET /bots/:id` - Détails bot
- `PATCH /bots/:id` - Modifier bot
- `DELETE /bots/:id` - Supprimer bot

## Structure du projet

```
backend/
├── src/
│   ├── config/
│   │   └── database.js      # Configuration Prisma
│   ├── middleware/
│   │   ├── auth.js          # Authentification JWT
│   │   └── validation.js    # Validation Zod
│   ├── routes/
│   │   ├── auth.js          # Routes auth
│   │   ├── users.js         # Routes utilisateurs
│   │   ├── servers.js       # Routes serveurs
│   │   ├── channels.js      # Routes canaux
│   │   ├── messages.js      # Routes messages
│   │   ├── invites.js       # Routes invitations
│   │   └── bots.js          # Routes bots
│   └── index.js             # Point d'entrée
├── prisma/
│   └── schema.prisma        # Schéma de base de données
├── .env.example             # Variables d'environnement
└── package.json
```

## Sécurité

- JWT pour l'authentification
- Validation des entrées avec Zod
- Rate limiting
- CORS configuré
- Helmet pour la sécurité HTTP

## Base de données

Le schéma utilise Prisma avec MySQL. Les tables principales sont :
- `users` - Utilisateurs
- `servers` - Serveurs
- `channels` - Canaux
- `messages` - Messages
- `server_members` - Membres des serveurs
- `invites` - Invitations
- `bots` - Bots

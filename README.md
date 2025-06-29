# 🤖 Chatbot IA Sécurisé

Une application de chatbot complète utilisant l'API OpenAI GPT-4o Mini avec une architecture sécurisée et des sessions utilisateur isolées.

## ✨ Fonctionnalités

- 🧠 **IA Conversationnelle** : Intégration avec GPT-4o Mini d'OpenAI
- 🔒 **Sécurité** : Clé API protégée côté serveur, sessions utilisateur isolées
- 📊 **Limitation** : Quota hebdomadaire configurable (défaut: 4000 prompts)
- 💬 **Sessions** : Historique de conversation par utilisateur avec UUID unique
- 📱 **Responsive** : Interface adaptative optimisée pour iframe
- 🎨 **Design Moderne** : Interface épurée avec animations fluides

## 🏗️ Architecture

```
├── src/                 # Frontend React + TypeScript
│   ├── App.tsx         # Interface de chat principale
│   └── ...
├── server/             # Backend Express.js
│   ├── index.js       # Serveur API
│   ├── .env           # Variables d'environnement (à créer)
│   └── .env.example   # Template de configuration
└── README.md
```

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18+ 
- Clé API OpenAI ([obtenir ici](https://platform.openai.com/api-keys))

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration des variables d'environnement

Créez un fichier `.env` dans le dossier `server/` :

```bash
cp server/.env.example server/.env
```

Editez le fichier `server/.env` et ajoutez votre clé API OpenAI :

```env
OPENAI_API_KEY=sk-votre-cle-api-openai-ici
MAX_PROMPTS_PER_WEEK=4000
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### 3. Démarrage en développement

**Option A : Démarrage complet (frontend + backend)**
```bash
npm run dev:full
```

**Option B : Démarrage séparé**

Terminal 1 (Backend) :
```bash
npm run server
```

Terminal 2 (Frontend) :
```bash
npm run dev
```

### 4. Accès à l'application

- **Frontend** : http://localhost:5173
- **API Backend** : http://localhost:3001

## 🌐 Déploiement

### Vercel (Recommandé)

1. **Frontend** :
   ```bash
   npm run build
   vercel --prod
   ```

2. **Backend** : Créez un projet séparé pour le serveur ou utilisez Vercel Functions

### Render

1. Connectez votre repository GitHub
2. Configurez les variables d'environnement dans le dashboard
3. Définissez les commandes :
   - **Build** : `npm install`
   - **Start** : `npm run server`

### Railway

```bash
railway login
railway init
railway add
railway up
```

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `OPENAI_API_KEY` | Clé API OpenAI (obligatoire) | - |
| `MAX_PROMPTS_PER_WEEK` | Limite hebdomadaire de prompts | 4000 |
| `FRONTEND_URL` | URL du frontend pour CORS | http://localhost:5173 |
| `PORT` | Port du serveur backend | 3001 |

**Important** : Le fichier `.env` doit être placé dans le dossier `server/` et non à la racine du projet.

### Intégration iframe (360Learning)

L'application est optimisée pour l'intégration en iframe :

```html
<iframe 
  src="https://votre-app.vercel.app" 
  width="100%" 
  height="600"
  frameborder="0">
</iframe>
```

Caractéristiques iframe :
- ✅ Hauteur minimale : 600px
- ✅ Design responsive
- ✅ Pas de header/footer externe
- ✅ Interface épurée

## 📡 API Endpoints

### Backend (`/api`)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `POST /api/user/new` | POST | Créer une nouvelle session utilisateur |
| `GET /api/user/:userId/history` | GET | Récupérer l'historique d'un utilisateur |
| `POST /api/chat` | POST | Envoyer un message au chatbot |
| `GET /api/stats` | GET | Obtenir les statistiques d'usage |
| `GET /api/health` | GET | Vérifier la santé du serveur |

### Exemple d'utilisation

```javascript
// Créer un nouvel utilisateur
const response = await fetch('/api/user/new', { method: 'POST' });
const { userId } = await response.json();

// Envoyer un message
const chatResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: userId,
    message: "Bonjour, comment allez-vous ?"
  })
});
```

## 🔒 Sécurité

- ✅ **Clé API protégée** : Stockée uniquement côté serveur dans `server/.env`
- ✅ **Sessions isolées** : Chaque utilisateur a son propre historique
- ✅ **Validation** : Vérification des entrées utilisateur
- ✅ **CORS configuré** : Protection contre les attaques cross-origin
- ✅ **Limitation de débit** : Quota hebdomadaire pour éviter les abus

## 🐛 Dépannage

### Erreurs courantes

**1. "OPENAI_API_KEY manquante dans le fichier server/.env"**
- Vérifiez que le fichier `server/.env` existe et contient la clé
- Copiez `server/.env.example` vers `server/.env` si nécessaire
- Redémarrez le serveur après modification

**2. "Session utilisateur non trouvée"**
- Videz le sessionStorage du navigateur
- Rafraîchissez la page pour créer une nouvelle session

**3. "Limite hebdomadaire atteinte"**
- Attendez le début de la semaine suivante
- Ou augmentez `MAX_PROMPTS_PER_WEEK` dans `server/.env`

### Logs et debugging

```bash
# Voir les logs du serveur
npm run server

# Vérifier la santé de l'API
curl http://localhost:3001/api/health
```

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

---

Made with ❤️ for 360Learning integration
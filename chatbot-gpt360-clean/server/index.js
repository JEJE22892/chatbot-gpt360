import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le fichier .env depuis le dossier server
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_PROMPTS_PER_WEEK = parseInt(process.env.MAX_PROMPTS_PER_WEEK) || 4000;

// Stockage en mémoire
const userSessions = new Map(); // userId -> conversation history
const promptCounter = {
  count: 0,
  weekStart: new Date(),
  resetWeekly() {
    const now = new Date();
    const weeksSince = Math.floor((now - this.weekStart) / (7 * 24 * 60 * 60 * 1000));
    if (weeksSince >= 1) {
      this.count = 0;
      this.weekStart = now;
    }
  }
};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Vérification de la clé API
if (!OPENAI_API_KEY) {
  console.error('⚠️  OPENAI_API_KEY manquante dans le fichier server/.env');
  console.error('📝 Copiez server/.env.example vers server/.env et ajoutez votre clé API');
  process.exit(1);
}

// Routes

// Génération d'un nouvel ID utilisateur
app.post('/api/user/new', (req, res) => {
  const userId = uuidv4();
  userSessions.set(userId, []);
  
  res.json({ 
    userId,
    message: 'Nouvelle session créée avec succès'
  });
});

// Récupération de l'historique d'un utilisateur
app.get('/api/user/:userId/history', (req, res) => {
  const { userId } = req.params;
  
  if (!userSessions.has(userId)) {
    return res.status(404).json({ 
      error: 'Session utilisateur non trouvée' 
    });
  }
  
  const history = userSessions.get(userId);
  res.json({ history });
});

// Statistiques globales
app.get('/api/stats', (req, res) => {
  promptCounter.resetWeekly();
  
  res.json({
    promptsUsed: promptCounter.count,
    maxPrompts: MAX_PROMPTS_PER_WEEK,
    remaining: Math.max(0, MAX_PROMPTS_PER_WEEK - promptCounter.count),
    weekStart: promptCounter.weekStart
  });
});

// Endpoint principal pour le chat
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    // Validation
    if (!userId || !message) {
      return res.status(400).json({ 
        error: 'userId et message sont requis' 
      });
    }
    
    // Vérifier si l'utilisateur existe
    if (!userSessions.has(userId)) {
      return res.status(404).json({ 
        error: 'Session utilisateur non trouvée' 
      });
    }
    
    // Vérifier la limite de prompts
    promptCounter.resetWeekly();
    if (promptCounter.count >= MAX_PROMPTS_PER_WEEK) {
      return res.status(429).json({ 
        error: `Limite hebdomadaire de ${MAX_PROMPTS_PER_WEEK} prompts atteinte. Réessayez la semaine prochaine.`,
        code: 'WEEKLY_LIMIT_EXCEEDED'
      });
    }
    
    // Récupérer l'historique
    const conversation = userSessions.get(userId);
    
    // Préparer les messages pour OpenAI
    const messages = [
      {
        role: 'system',
        content: 'Tu es un assistant IA utile et bienveillant. Réponds de manière concise et professionnelle en français.'
      },
      ...conversation,
      {
        role: 'user',
        content: message
      }
    ];
    
    // Appel à l'API OpenAI
    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const aiResponse = openaiResponse.data.choices[0].message.content;
    
    // Mettre à jour l'historique
    conversation.push(
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    );
    
    // Limiter l'historique à 20 messages pour éviter les contexts trop longs
    if (conversation.length > 20) {
      conversation.splice(0, conversation.length - 20);
    }
    
    userSessions.set(userId, conversation);
    
    // Incrémenter le compteur
    promptCounter.count++;
    
    res.json({
      response: aiResponse,
      promptsRemaining: Math.max(0, MAX_PROMPTS_PER_WEEK - promptCounter.count)
    });
    
  } catch (error) {
    console.error('Erreur API OpenAI:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      res.status(500).json({ 
        error: 'Clé API OpenAI invalide' 
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({ 
        error: 'Limite de l\'API OpenAI atteinte, réessayez plus tard' 
      });
    } else {
      res.status(500).json({ 
        error: 'Erreur interne du serveur' 
      });
    }
  }
});

// Santé du serveur
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    promptsUsed: promptCounter.count,
    maxPrompts: MAX_PROMPTS_PER_WEEK
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Limite hebdomadaire: ${MAX_PROMPTS_PER_WEEK} prompts`);
  console.log(`🔑 API OpenAI: ${OPENAI_API_KEY ? '✅ Configurée' : '❌ Manquante'}`);
  console.log(`📁 Fichier .env chargé depuis: ${path.join(__dirname, '.env')}`);
});